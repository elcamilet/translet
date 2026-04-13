# Translet

Traductor web minimalista con DeepL, pensado para ejecutarse en Docker.
Sin telemetría ni historias.

## Qué incluye

- Interfaz simple con idioma origen, destino, intercambio, input y output.
- Traducción automática al escribir.
- Indicador de consumo mensual de caracteres de DeepL.
- Bloqueo preventivo de traducción cuando la petición superaría el límite mensual de 500000 caracteres del plan gratuito de DeepL.
- API key protegida en el backend mediante variable de entorno.

## Variables de entorno

- `DEEPL_API_KEY`: clave de DeepL API Free.
- `PORT`: puerto HTTP del contenedor, por defecto `3000`.

## Ejecutar con Docker Compose

1. Copia `.env.example` a `.env`.
2. Edita `.env` y pon tu clave real.
3. Ejecuta:

```bash
docker compose up -d --build
```

4. Abre:

```text
http://localhost:3000
```

## Build manual

```bash
docker build -t translet:latest .
```

## Run manual

```bash
docker run -d   --name translet   -p 3000:3000   -e DEEPL_API_KEY='TU_API_KEY'   -e PORT=3000   --restart unless-stopped   translet:latest
```

## Estructura

```text
translet/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── src/
    ├── server.js
    └── public/
        └── index.html
```

## Notas

- Requiere Node 20 dentro del contenedor para usar `fetch` nativo.


## Cambios recientes

- Añadido sistema de idiomas pineados al inicio del desplegable.
- Pineados por defecto: `EN-US`, `CA` y `ES` en destino; `EN`, `CA`, `ES` y `Detectar idioma` en origen.
- Gestión de pineados desde el botón `★` junto al selector de idioma.
