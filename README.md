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

Stoppen:

```bash
docker compose down
```

Scalen voorbeeld:
```bash
docker compose scale target-service=1
```


---

## Teststatus

[![Node CI](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/node-ci.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/node-ci.yml)

```bash
npm test
```
