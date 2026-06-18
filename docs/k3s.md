# En local

## Pour se connecter en local à harbor

(sur le server apres `sudo -i`)

En cas d'oublie du password (login: admin)

```bash
kubectl get secret harbor-admin-password -n harbor -o jsonpath='{.data.HARBOR_ADMIN_PASSWORD}' | base64 -d
```

Connection en local à docker

```bash
docker login harbor.dov118.com
```

## Build en local de l'image et push sur harbor

Pour build et push

```bash
docker buildx build \
  --platform linux/amd64 \
  -t harbor.dov118.com/dov118/nestjs:1.0.0-dev.0 \
  --no-cache \
  --push .
```

Pour juste push

```bash
docker push harbor.dov118.com/dov118/nestjs:1.0.0-dev.0
```

# Sur le server

Passage en sudo

```bash
sudo -i
```

## Création d'un utilisateur mysql + de la database

Définition des infos de connection

```bash
MYSQL_USER=""
MYSQL_DATABASE=""
MYSQL_HOST=""
MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

echo $MYSQL_PASSWORD
```

Création de la base de donnée et de l'utilisateur + droits

```bash
mysql -h $MYSQL_HOST -uroot -p <<EOF
CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';
FLUSH PRIVILEGES;
EOF
```

Création du namespace

```bash
kubectl create namespace web-api-nestjs-kevin-c-fr --dry-run=client -o json | kubectl apply -f -
```

Création des crédentials de connection à la base de données

```bash
kubectl create secret generic api-nestjs-kevin-c-fr-database-creds \
  --namespace=web-api-nestjs-kevin-c-fr \
  --from-literal=DB_PASSWORD="$MYSQL_PASSWORD" \
  --from-literal=DB_USER="$MYSQL_USER" \
  --from-literal=DB_NAME="$MYSQL_DATABASE" \
  --from-literal=DB_HOST="$MYSQL_HOST" \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Création du paramétrage harbor

```bash
HARBOR_USER="admin"
HARBOR_PASSWORD=$(kubectl get secret harbor-admin-password -n harbor -o jsonpath='{.data.HARBOR_ADMIN_PASSWORD}' | base64 --decode)
HARBOR_EMAIL="kevincarlier118@gmail.com"

echo $HARBOR_USER
echo $HARBOR_PASSWORD
echo $HARBOR_EMAIL
```

```bash
kubectl -n web-api-nestjs-kevin-c-fr create secret docker-registry api-nestjs-kevin-c-fr-harbor-creds \
  --docker-server="harbor.dov118.com" \
  --docker-username="$HARBOR_USER" \
  --docker-password="$HARBOR_PASSWORD" \
  --docker-email="$HARBOR_EMAIL"
```

### Dimentionnement

On prend a chaque fois le choix le plus haut

Les données sont a prendre sur 24h avec un démarrage complet (ex création BDD + migration)

Unité CPU en m

Unité RAM en Mi

Si max(ACG, P95) est inférieur au 3/4 de MAX alors prendre MAX

CPU et RAM:

- requested => max(ACG, P95) \* 1,5
- limit => requested \* 10

On arrondit au 25m suppérieur pour CPU

On arrondit à la puissance de 2 supérieur (128, 256, 512, 1024, 2048, 4096, ...)

Quelque soit le résultat, toujours mettre 250m CPU et 512Mi RAM

(256m, 512Mi => AWS)

## Paramétrage du deployment, service, ingress ...

Création du Deployment

```bash
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-nestjs-kevin-c-fr-deploy
  namespace: web-api-nestjs-kevin-c-fr
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-nestjs-kevin-c-fr-deploy
  template:
    metadata:
      labels:
        app: api-nestjs-kevin-c-fr-deploy
    spec:
      imagePullSecrets:
      - name: api-nestjs-kevin-c-fr-harbor-creds
      containers:
      - name: nestjs-api
        image: harbor.dov118.com/dov118/nestjs:1.0.0-dev.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi" # AVG 223 -- P95 228 -- MAX 234 -- 3/4 MAX 175.5 => 228 => 228 * 1,5 = 342 => 512 -> 512Mi
            cpu: "250m" # AVG 53.5 -- P95 63.4 -- MAX 79 -- 3/4 MAX 59.25 => 63.4 => 63.4 * 1,5 = 95.1 => 100 -> 250m
          limits:
            memory: "4096Mi"
            cpu: "2500m"
        readinessProbe:
          httpGet:
            path: /service/ready
            port: 3000
            scheme: HTTP
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
          successThreshold: 2
        livenessProbe:
          httpGet:
            path: /service/live
            port: 3000
          initialDelaySeconds: 90
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        env:
        - name: NODE_ENV
          value: "production"
        - name: APP_NAME
          value: "nestjs"
        - name: APP_PORT
          value: "3000"
        - name: DB_TYPE
          value: "mysql"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: api-nestjs-kevin-c-fr-database-creds
              key: DB_HOST
        - name: DB_PORT
          value: "3306"
        - name: DB_NAME
          valueFrom:
            secretKeyRef:
              name: api-nestjs-kevin-c-fr-database-creds
              key: DB_NAME
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: api-nestjs-kevin-c-fr-database-creds
              key: DB_USER
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: api-nestjs-kevin-c-fr-database-creds
              key: DB_PASSWORD
        - name: DB_DEBUG
          value: "false"
        - name: LOG_LEVEL
          value: "info"
        - name: INTERVAL_MS
          value: "5000"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_UID
          valueFrom:
            fieldRef:
              fieldPath: metadata.uid
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
EOF
```

Déclaration du Service

```bash
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: api-nestjs-kevin-c-fr-svc
  namespace: web-api-nestjs-kevin-c-fr
spec:
  selector:
    app: api-nestjs-kevin-c-fr-deploy
  ports:
  - name: http
    port: 80
    targetPort: 3000
EOF
```

Déclaration d’un Middleware de redirection https

```bash
kubectl apply -f - <<'EOF'
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: api-nestjs-kevin-c-fr-redirect-https
  namespace: web-api-nestjs-kevin-c-fr
spec:
  redirectScheme:
    scheme: https
    permanent: true
    port: "443"
EOF
```

Déclaration du Ingress

```bash
kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-nestjs-kevin-c-fr-ingress
  namespace: web-api-nestjs-kevin-c-fr
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
    traefik.ingress.kubernetes.io/router.middlewares: web-api-nestjs-kevin-c-fr-api-nestjs-kevin-c-fr-redirect-https@kubernetescrd
spec:
  ingressClassName: traefik
  tls:
  - hosts:
    - api.nestjs.kevin-c.fr
    secretName: api-nestjs-kevin-c-fr-tls
  rules:
  - host: api.nestjs.kevin-c.fr
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-nestjs-kevin-c-fr-svc
            port:
              number: 80
EOF
```

## Check finaux

Check la génération du certificat https

```bash
kubectl get certificates -A -w
```

Check des pods

```bash
kubectl get pods -n web-api-nestjs-kevin-c-fr -w
```
