# Develop environment — nginx setup

One-time server-side setup so the `deploy-develop.yml` workflow (which copies the
SPA to `/var/www/mana-community-dev`) is actually reachable on a URL.

This runs on the **same Lightsail host** as production; it only adds a second
server block + web root.

## 1. DNS

Point a hostname at the Lightsail static IP (the same IP as production):

```
dev.manacommunity.example.   A   <LIGHTSAIL_STATIC_IP>
```

(Use a subdomain you control; update `server_name` in the conf to match.)

## 2. Install the server block

```bash
# from the repo checkout on the server, or scp the file up
sudo cp deploy/nginx/mana-community-dev.conf /etc/nginx/sites-available/mana-community-dev
sudo ln -s /etc/nginx/sites-available/mana-community-dev /etc/nginx/sites-enabled/
sudo mkdir -p /var/www/mana-community-dev
sudo chown -R www-data:www-data /var/www/mana-community-dev
sudo nginx -t && sudo systemctl reload nginx
```

## 3. TLS (Let's Encrypt)

```bash
sudo certbot --nginx -d dev.manacommunity.example
```

Certbot rewrites the server block to add the `listen 443 ssl` lines and an
HTTP→HTTPS redirect, then auto-renews.

## 4. Backend port

The conf proxies `/api` and `/ws` to `127.0.0.1:8080`, i.e. **develop shares the
production backend**. If you want an isolated dev backend, run that Spring Boot
instance on another port (e.g. `8081`) and change every `:8080` in the conf to it.

## 5. Verify

Push to `develop` (or re-run the workflow), then:

```bash
curl -I http://dev.manacommunity.example         # 200, serves index.html
ls -lah /var/www/mana-community-dev               # build files present
```

The Architecture Docs page header shows the deployed **branch + build time**, so
you can confirm the dev box is serving the `develop` build.
