============
Installation
============

Prepare SD Card
~~~~~~~~~~~~~~~

On your host machine, get an already preinstalled OpenIO SDS image.

   .. code-block:: shell

    $ wget [URL] -O openio.img

Now insert your SD card into your host machine and write the image onto it.

   .. code-block:: shell

    # [DEVICE] refers to the device of your SD card, most probably it will be /dev/mmcblk0
    # You can check currently present devices using lsblk
    $ sudo dd if=$(pwd)/openio.img of=[DEVICE] status=progress bs=4M


Boot the Raspberry Pi
~~~~~~~~~~~~~~~~~~~~~

Remove the SD card from the host machine, insert it into the Raspberry Pi. Plug in the ethernet cable.
You might also plug in an HDMI cable, although it's not necessary.
Finally plug in the power cable and let the Raspberry Pi boot.

Let the first time setup complete, the Raspberry will have to reboot once
(in order to resize its partition to the size of the SD card). This should take about 3 minutes.

Test OpenIO
~~~~~~~~~~~

You can now use OpenIO via all 3 options listed below. `RPI_IP` is the IP address given to your Raspberry PI by your
DHCP server.

- **Using the OpenIO CLI**


Login into your Raspberry Pi (Login: root, Password: root) via SSH and create an object:

   .. code-block:: shell

    $ ssh root@[RPI_IP]

    $ openio object create --oio-ns OPENIO --oio-account testacc testcont /etc/magic
    +-------+------+----------------------------------+--------+
    | Name  | Size | Hash                             | Status |
    +-------+------+----------------------------------+--------+
    | magic |  111 | 272913026300E7AE9B5E2D51F138E674 | Ok     |
    +-------+------+----------------------------------+--------+

- **Using Swift**


Install python-swiftclient on your host machine and upload a file

   .. code-block:: shell

    $ apt -y install python-swiftclient

    $ swift -A http://[RPI_IP]:6007/auth/v1.0/ -U demo:demo -K DEMO_PASS upload container1 /etc/hostname
    etc/hostname

- **Using S3**


For example, using awsclis

   .. code-block:: shell

    $ apt -y install awscli
    $ aws --endpoint-url http://[RPI_IP]:6007 --no-verify-ssl s3 cp /proc/cpuinfo s3://mycontainer/
    upload: ../../proc/cpuinfo to s3://mycontainer/cpuinfo

Known limitations
~~~~~~~~~~~~~~~~~

- One major limitation of the current setup is that your IP given to the Raspberry Pi should always stay the same.
  You can always etch the image again onto the SD card and start over with a new IP, which will result in data loss.

- Another limitation is that the current setup is not designed to be scalable, and is provided as is,
  i.e. as a standalone node, meant solely for testing purposes.
  Please refer to our other guides to learn how to setup a scalable OpenIO cluster.
