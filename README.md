# Sistema de Reservas de Equipos (ICIMEDES)

Proyecto estatico para GitHub Pages con Supabase y FullCalendar. No usa autenticacion ni sesiones. El acceso se controla por validacion de correo institucional en el frontend y por RLS en la base de datos.

## Estructura

```
reservas-equipo/
├── index.html
├── dashboard.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── supabase.js
│       ├── reservas.js
│       └── calendar.js
└── README.md
```

## Configuracion

1. Cree el esquema en Supabase (tablas, RLS, funcion existe_conflicto).
2. Copie su URL y anon key en assets/js/supabase.js.
3. Publique en GitHub Pages.

## Notas de seguridad

- El calendario publico debe consultar solo campos no sensibles.
- Para mayor proteccion, cree una vista publica en Supabase y consulte esa vista en dashboard.html.
