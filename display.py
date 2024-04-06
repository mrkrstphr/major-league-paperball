#!/usr/bin/python3
# adapted from: https://github.com/mendhak/waveshare-epaper-display
import sys
import os
import logging
from PIL import Image

version = os.getenv("WAVESHARE_EPD75_VERSION", "2")

if (version == "1"):
    from lib.epaper import epd7in5 as epd7in5
elif (version == "2B"):
    from lib.epaper import epd7in5b_V2 as epd7in5
else:
    from lib.epaper import epd7in5_V2 as epd7in5

try:
    epd = epd7in5.EPD()
    epd.init()

    filename = sys.argv[1]
    Himage = Image.open(filename)

    if version == "2B":
        Limage_Other = Image.new('1', (epd.height, epd.width), 255)  # 255: clear the frame
        epd.display(epd.getbuffer(Himage), epd.getbuffer(Limage_Other))
    else:
        epd.display(epd.getbuffer(Himage))
    epd.sleep()

except IOError as e:
    print(e)

except KeyboardInterrupt:
    epd7in5.epdconfig.module_exit()
    exit()

