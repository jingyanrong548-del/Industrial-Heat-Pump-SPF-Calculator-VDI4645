# Deploy SPF calculator (`spf.openthermalai.com`)

## Architecture

| Piece | Location |
|-------|----------|
| Static UI | `/www/wwwroot/spf.openthermalai.com` |
| `/calculate` API | systemd `spf-calculate-api` → `127.0.0.1:9106` under `/opt/spf-calculate-api` |
| Nginx proxy | `include …/proxy/spf-calculate.conf` in the site vhost |

Open Thermal AI project analysis uses **loopback** `ENGINE_SPF_BASE=http://127.0.0.1:9106` (not the public HTTPS origin).

## Prerequisites

1. DNS: `spf` A → `8.138.191.154` on `openthermalai.com`
2. Baota site root: `/www/wwwroot/spf.openthermalai.com` + SSL
3. GitHub repo Variables: `ALIYUN_DEPLOY_ENABLED=true`
4. GitHub Secret: `ALIYUN_SSH_PRIVATE_KEY` (same deploy key as the main site)

## CI

Push to `main` or run **Deploy to Aliyun (spf)** → SSH+tar static files and refresh the API unit.

## Manual one-shot (from this repo)

```bash
# Static
mkdir -p /tmp/spf-dist/ota-tool-chrome
cp index.html /tmp/spf-dist/
cp -R public/ota-tool-chrome/. /tmp/spf-dist/ota-tool-chrome/
COPYFILE_DISABLE=1 tar --format=ustar -czf - -C /tmp/spf-dist . \
  | ssh -i ~/.ssh/aliyun_deploy root@8.138.191.154 \
    "cd /www/wwwroot/spf.openthermalai.com && find . -mindepth 1 -maxdepth 1 ! -name '.user.ini' ! -name '.htaccess' ! -name '.well-known' -exec rm -rf {} + && tar xzf -"
```
