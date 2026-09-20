# Skill — Multi-Tenant

## Princípios
- Hostname é resolvido contra registro conhecido.
- Nunca aceitar tenant/API arbitrários.
- Não guardar secrets no registro público.
- Normalizar www e portas.
- Suportar localhost.
- Isolar contexto de tenant.
