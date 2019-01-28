你愛家，我解惑 API server
=========

## Development

### First clone
1. `npm install`
2. copy `.env.sample` to `.env`. By default it is paired with settings inside `docker-compose.yml`, thus no need to change for local development.

### During development
To start up the API server, please follow these steps:

1. Start dependencies via `docker-compose up`
2. On another terminal, start API server via `npm start`

Both step would attach to the terminal window. Ctrl-C to stop any of them

## Test

First, clean up the current database specified in `.env`.

```
$ curl -X localhost:9200/_all
```

Then run the following to set mongodb validator & elasticsearch mappings
```
$ npm run schema
```

Lastly, run:
```
$ npm test
```

Note: unit test clears the databases `.env` specifies.
