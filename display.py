#!/usr/bin/python3
import sys
import os
import logging
import datetime
from PIL import Image

#configure_logging()

waveshare_epd75_version = os.getenv("WAVESHARE_EPD75_VERSION", "2")

if (waveshare_epd75_version == "1"):
    from lib.epaper import epd7in5 as epd7in5
elif (waveshare_epd75_version == "2B"):
    from lib.epaper import epd7in5b_V2 as epd7in5
else:
    from lib.epaper import epd7in5_V2 as epd7in5

try:
    epd = epd7in5.EPD()
    logging.debug("Initialize screen")
    epd.init()

    filename = sys.argv[1]

    logging.debug("Read image file: " + filename)
    Himage = Image.open(filename)
    logging.info("Display image file on screen")

    if waveshare_epd75_version == "2B":
        Limage_Other = Image.new('1', (epd.height, epd.width), 255)  # 255: clear the frame
        epd.display(epd.getbuffer(Himage), epd.getbuffer(Limage_Other))
    else:
        epd.display(epd.getbuffer(Himage))
    epd.sleep()

except IOError as e:
    logging.exception(e)

except KeyboardInterrupt:
    logging.debug("Keyboard Interrupt - Exit")
    epd7in5.epdconfig.module_exit()
    exit()

