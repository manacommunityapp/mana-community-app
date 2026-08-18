# Nginx setup — develop & production environments

Both server blocks live in this directory:

| File | Environment | Web root |
|------|-------------|----------|
| `mana-community.conf` | **Production** (`main` branch) | `/var/www/mana-community` |
| `mana-community-dev.conf` | **Develop** (`develop` branch) | `/var/www/mana-community-dev` |

Both configs run on the same Lightsail host and proxy `/api/` and `/ws` to the
Spring Boot backend on `127.0.0.1:8080`.

---

## Why CORS headers are in nginx

Safari on iPhone sends an HTTP `OPTIONS` **preflight** before every `POST`,
`PUT`, `PATCH`, or `DELETE` that includes a custom header
(`Authorization`, `Content-Type: application/json`, `X-Correlation-Id`).
If the server doesn't reply to that preflight with the right
`Access-Control-Allow-*` headers the browser silently aborts the real request —
the app shows a CORS or network error on the login screen.

Both configs handle this at the nginx layer:

* `OPTIONS` requests to `/api/` are answered immediately with **204 No Content**
  and the full set of CORS headers. The request never reaches the backend.
* Every other proxied response also gets `Access-Control-Allow-Origin` and
  `Access-Control-Allow-Credentials` added (the `always` flag ensures they appear
  on 4xx/5xx responses too).
* A `map` block restricts allowed origins to the known hostnames; unrecognised
  origins get an empty value so the browser blocks the request.

---

## 1. Production setup

### DNS

Point the root and www names at the Lightsail static IP:

```
manacommunityhub.com.      A   <LIGHTSAIL_STATIC_IP>
www.manacommunityhub.com.  A   <LIGHTSAIL_STATIC_IP>
```

### Install the server block

```bash
sudo cp deploy/nginx/mana-community.conf /etc/nginx/sites-available/mana-community
sudo ln -s /etc/nginx/sites-available/mana-community /etc/nginx/sites-enabled/
sudo mkdir -p /var/www/mana-community
sudo chown -R www-data:www-data /var/www/mana-community
sudo nginx -t && sudo systemctl reload nginx
```

### TLS (Let's Encrypt — required for iPhone/Safari)

```bash
sudo certbot --nginx -d manacommunityhub.com -d www.manacommunityhub.com
```

Certbot rewrites the server block to add `listen 443 ssl` and the certificate
paths, then auto-renews via a systemd timer.

---

## 2. Develop setup

### DNS

Point a subdomain at the same Lightsail IP:

```
dev.manacommunityhub.com.  A   <LIGHTSAIL_STATIC_IP>
```

Update `server_name` in `mana-community-dev.conf` to match.

### Install

```bash
sudo cp deploy/nginx/mana-community-dev.conf /etc/nginx/sites-available/mana-community-dev
sudo ln -s /etc/nginx/sites-available/mana-community-dev /etc/nginx/sites-enabled/
sudo mkdir -p /var/www/mana-community-dev
sudo chown -R www-data:www-data /var/www/mana-community-dev
sudo nginx -t && sudo systemctl reload nginx
```

### TLS

```bash
sudo certbot --nginx -d dev.manacommunityhub.com
```

---

## 3. Backend port

Both configs proxy to `127.0.0.1:8080` (default Spring Boot port).
If the develop environment runs a separate backend instance, change
every `:8080` in `mana-community-dev.conf` to that port (e.g. `8081`).

---

## 4. Verify after deploy

```bash
# Production
curl -I https://manacommunityhub.com
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  -H "Origin: https://manacommunityhub.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  https://manacommunityhub.com/api/auth/login
# Should return 204 with Access-Control-Allow-Origin header

# Develop
curl -I https://dev.manacommunityhub.com
```

The Architecture Docs page header shows the deployed **branch + build time** so
you can confirm the right build is live.
