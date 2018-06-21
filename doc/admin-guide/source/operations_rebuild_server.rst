================
Rebuild a server
================

Preparation
~~~~~~~~~~~

The following procedure describes how to rebuild broken services in-place.
The actual storage volumes may be different, but the services have to expose the same IP address and ports as the old broken services.

1. Reconfigure the "resolver" cache with short timeouts. (version 4.1.9 required)

::

    $ export PROXY=IP:PORT

    $ echo echo "Current configuration"
    $ curl -s http://$PROXY/v3.0/config | \
      python -m json.tool | \
      grep -E 'resolver.cache.srv.ttl.default|resolver.cache.csm0.ttl.default'
    "resolver.cache.csm0.ttl.default": "0",
    "resolver.cache.srv.ttl.default": "0",

    $ curl -XPOST -d '{"resolver.cache.csm0.ttl.default": 1, "resolver.cache.srv.ttl.default": 1}' \
          http://$PROXY/config
    $ for type in meta0 meta1 meta2; do
        openio cluster list $type -f csv --quote none -c "Id" | tail -n+2 | while read url; do
            curl -XPOST -d '{"resolver.cache.csm0.ttl.default": 1, "resolver.cache.srv.ttl.default": 1}' "http://${PROXY}/v3.0/forward/config?id=$url"
        done
    done


2. Start services

    ``$ gridinit_cmd start``

    Restart meta1 to ensure proper provisioning

    ``$ sleep 5; gridinit_cmd restart @meta1``

3. Launch ``oio-meta2-rebuilder`` to speed up rebuilding:

    When a write request arrives on a missing base, this base is downloaded from the current master service.
    ``oio-meta2-rebuilder`` sends dummy write orders to all containers to force replication of all under-replicated databases.

::
    $ oio-meta1-rebuilder --report-interval 60 NS
    14646 7F093326E550 log INFO RUN worker=0 started=2018-06-21T10:06:50 passes=1 errors=0 meta1_prefixes=1 134.30/s waiting_time=0.00 rebuilder_time=0.01 total_time=0.01 (rebuilder: 100.00%)
    ...
    $ oio-meta2-rebuilder --report-interval 60 NS
    30513 7F3E781525F0 log INFO RUN worker=0 started=2018-06-21T10:12:14 passes=1 errors=0 meta2_references=1 80.54/s waiting_time=0.01 rebuilder_time=0.00 total_time=0.01 (rebuilder: 100.00%)
    ...

4. Launch ``oio-blob-rebuilder`` to fix chunks

::

    # Launch rawx rebuild only on recommissioned server
    $ openio cluster list rawx -f csv -c Id | grep SRVIP | tail -n+2 | while read rawx; do
        oio-blob-rebuilder --allow-same-rawx --worker 10  --volume $SRVIP --report-interval 60 NS
    done


5. Reset configuration of resolver cache (retrieved at 1.)

::

    $ export PROXY=IP:PORT
    $ export V=0

    $ curl -XPOST -d '{"resolver.cache.csm0.ttl.default": $V, "resolver.cache.srv.ttl.default": $V}' \
          http://$PROXY/config

    $ for type in meta0 meta1 meta2; do
        openio cluster list $type -f csv --quote none -c "Id" | tail -n+2 | while read url; do
            curl -XPOST -d '{"resolver.cache.csm0.ttl.default": $V, "resolver.cache.srv.ttl.default": $V}' "http://${PROXY}/v3.0/forward/config?id=$url"
        done
    done
