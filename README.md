# Photo Prestiges

## Het Concept
Een 'Target Owner' uploadt een foto met een specifieke locatie en een tijdslimiet. Deelnemers gaan de stad in om deze foto te reproduceren. Het systeem analyseert de inzendingen automatisch met behulp van AI-beeldherkenning en berekent een score gebaseerd op nauwkeurigheid en snelheid.

---

## Technische Architectuur (Cloud Services)
Deze applicatie is gebouwd volgens een **Microservices Architectuur** om schaalbaarheid en ontkoppeling te garanderen.

### De Services:
* **Identity Service:** Beheert gebruikers, registraties en authenticatie (JWT).
* **Target Service:** Beheert de "speurtochten" (locaties, deadlines en metadata).
* **Submission Service:** Verwerkt de foto-uploads van deelnemers.
* **Score Service:** Voert de AI-analyse uit via externe API's (Google Vision / Imagga) en berekent de winnaar.
* **Mail Service:** Verstuurt transactionele e-mails (bevestigingen, herinneringen en uitslagen).
* **Clock Service:** Monitort deadlines en triggert het afsluiten van wedstrijden.
* **Read Service:** Levert leesoverzichten, zoals een lijst van alle actieve wedstrijden.

### Cloud Stack & Tools:
* **Runtime:** Node.js met Express.js
* **Messaging:** RabbitMQ (voor asynchrone communicatie tussen services)
* **Databases:** MongoDB (voor Geospatial data) & PostgreSQL (voor relationele data)
* **Storage:** Cloud Object Storage (voor het hosten van afbeeldingen via URL)
* **Testing:** Postman

---

## Run met Docker

Start de app vanuit de root van het project:

```bash
docker compose up --build
```

De applicatie is daarna bereikbaar op:

```text
http://localhost:3000
```

Monitoring services:

```text
Prometheus: http://localhost:9090
Grafana: http://localhost:3001
```

Grafana standaard login:

```text
user: admin
password: admin123
```

Stoppen:

```bash
docker compose down
```

Scalen voorbeeld:
```bash
docker compose scale target-service=1
```
Admin seeder
```bash
docker compose run --rm auth-service npm run seed:owner
```


Monitoring stack starten (indien nog niet actief):

```bash
docker compose up -d prometheus blackbox-exporter grafana
```

## Docker Swarm lokaal

Docker Swarm gebruikt images in plaats van `build:` uit Docker Compose. Bouw daarom eerst lokale images:

```bash
bash scripts/build-swarm-images.sh
```
or 

```bash
.\scripts\build-swarm-images.ps1
```

Start Swarm als dat nog niet actief is:

```bash
docker swarm init
```

Deploy de stack:

```bash
docker stack deploy -c docker-stack.yml photo
```

Bekijk de services en replicas:

```bash
docker stack services photo
```

Voorbeeld van horizontal scaling zonder rebuild:

```bash
docker service scale photo_target-service=3
docker service scale photo_photo-prestige=3
```

Andere stateless services schalen:

```bash
docker service scale photo_auth-service=3
docker service scale photo_register-service=3
docker service scale photo_score-service=3
docker service scale photo_read-service=3
```

Bekijk de tasks van een service:

```bash
docker service ps photo_target-service
```

De gateway blijft bereikbaar op:

```text
http://localhost:3000
```

Ruim de Swarm stack op:

```bash
docker stack rm photo
```

Stop Swarm lokaal als je het niet meer nodig hebt:

```bash
docker swarm leave --force
```

Schaal vooral stateless services zoals `photo-prestige`, `target-service`, `register-service`, `score-service`, `read-service` en `auth-service`. Laat databases, RabbitMQ en `clock-service` standaard op 1 replica.

## Admin Process (Seed data)
```bash
docker compose run --rm auth-service npm run seed:owner
```




---

## CI Status per Service

Elke service wordt automatisch gecontroleerd op **code guidelines (ESLint)** en **tests** bij elke push.

| Service | Status |
|---|---|
| auth-service | [![CI auth-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/node-ci.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/node-ci.yml) |
| clock-service | [![CI clock-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-clock-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-clock-service.yml) |
| mail-service | [![CI mail-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-mail-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-mail-service.yml) |
| photo-prestige | [![CI photo-prestige](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-photo-prestige.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-photo-prestige.yml) |
| read-service | [![CI read-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-read-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-read-service.yml) |
| register-service | [![CI register-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-register-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-register-service.yml) |
| score-service | [![CI score-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-score-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-score-service.yml) |
| target-service | [![CI target-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-target-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-target-service.yml) |
