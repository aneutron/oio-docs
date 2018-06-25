================
Rebuild a server
================

Preparation
~~~~~~~~~~~

The following procedure describes how to rebuild broken services in-place.
The actual storage volumes may be different, but the services have to expose the same IP address and ports as the old broken services.

1. Create a script ``oio-configure-timeout.sh`` to configure timeout resolver:

::

    #!/bin/bash
    PROXY=localip:addr
    VAL=${1:-0}

    echo echo "Current configuration"
    curl -s http://$PROXY/v3.0/config | \
      python -m json.tool | \
      grep -E 'resolver.cache.srv.ttl.default|resolver.cache.csm0.ttl.default'

    curl -XPOST -d '{"resolver.cache.csm0.ttl.default": '$VAL', "resolver.cache.srv.ttl.default": '$VAL'}' \
          http://$PROXY/config
    for type in meta0 meta1 meta2; do
        openio cluster list $type -f value -c "Id" | while read url; do
            curl -XPOST -d '{"resolver.cache.csm0.ttl.default": '$VAL', "resolver.cache.srv.ttl.default": '$VAL'}' \
                "http://${PROXY}/v3.0/forward/config?id=$url"
        done
    done

2. Reconfigure the "resolver" cache with short timeouts. (version 4.1.9 required)

::

    $ ./oio-configure-timeout.sh 1
    Current configuration
    "resolver.cache.csm0.ttl.default": "0",
    "resolver.cache.srv.ttl.default": "0",


3. Start services

    ``$ gridinit_cmd start``

    Restart meta1 to ensure proper provisioning

    ``$ sleep 5; gridinit_cmd restart @meta1``

4. Launch ``oio-meta2-rebuilder`` to speed up rebuilding:

    When a write request arrives on a missing base, this base is downloaded from the current master service.
    ``oio-meta2-rebuilder`` sends dummy write orders to all containers to force replication of all under-replicated databases.

::

    $ oio-meta1-rebuilder --report-interval 60 NS
    14646 7F093326E550 log INFO RUN worker=0 started=2018-06-21T10:06:50 passes=1 errors=0 meta1_prefixes=1 134.30/s waiting_time=0.00 rebuilder_time=0.01 total_time=0.01 (rebuilder: 100.00%)
    ...
    $ oio-meta2-rebuilder --report-interval 60 NS
    30513 7F3E781525F0 log INFO RUN worker=0 started=2018-06-21T10:12:14 passes=1 errors=0 meta2_references=1 80.54/s waiting_time=0.01 rebuilder_time=0.00 total_time=0.01 (rebuilder: 100.00%)
    ...

5. Launch ``oio-blob-rebuilder`` to fix chunks

::

    # Launch rawx rebuild only on recommissioned server
    $ openio cluster list rawx -f value -c Id | grep $SRVIP | while read rawx; do
        openio volume admin incident $rawx
        oio-blob-rebuilder --allow-same-rawx --worker 10  --volume $rawx --report-interval 60 NS
    done

6. Reset configuration of resolver cache (retrieved at 1.)

::

    $ ./oio-configure-timeout.sh 0
    Current configuration
    "resolver.cache.csm0.ttl.default": "1",
    "resolver.cache.srv.ttl.default": "1",
