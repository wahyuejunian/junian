# Modul Metode Gravitasi

## Pendahuluan
Percepatan gravitasi di permukaan bumi dinyatakan oleh hukum Newton:

$$g = \frac{G M}{r^2}$$

## Contoh kode
```python
import numpy as np
g = 6.674e-11 * 5.972e24 / 6.371e6**2
print(round(g, 2))
```

### Koreksi udara bebas
Koreksi $\Delta g_{FA} = 0.3086\,h$ mGal, dengan $h$ dalam meter.
