# ESASky astronomy demo fixtures

The demo expects two generated fixtures:

- `hsc_m51_sources.json`: about 40 Hubble Source Catalog sources around M51.
- `hst_m51_observations.json`: about 40 HST imaging observations around M51, including the real ESASky STC-S footprint geometry.

Generate both from the ESASky TAP service with:

```bash
node scripts/generate_esasky_demo_fixtures.mjs
```

The generator discovers the current ESASky tables through the TAP `descriptors` metadata rather than hard-coding physical table names.
