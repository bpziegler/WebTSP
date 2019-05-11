#!/bin/bash
# rsync index.htm lol-beat-best.com:~/apache-tomcat-9.0.17/webapps/webtsp/
rsync -a --stats index.htm dist lol-beat-best.com:~/apache-tomcat-9.0.17/webapps/webtsp/

