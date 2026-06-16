# Investigacion: Agente de Contenido de Ciberseguridad para LinkedIn

## Hallazgos Clave

### Fuentes RSS Recomendadas (Top 15)
1. **The Hacker News** - `https://feeds.feedburner.com/TheHackersNews` - Noticias generales de ciberseguridad, varios posts/dia
2. **BleepingComputer** - `https://www.bleepingcomputer.com/feed/` - Noticias, guias, tutoriales, muy activo
3. **Dark Reading** - `https://www.darkreading.com/rss.xml` - Noticias enterprise, analisis profundo
4. **SecurityWeek** - `https://www.securityweek.com/feed/` - Noticias enterprise de seguridad
5. **Ars Technica Security** - `https://arstechnica.com/security/feed/` - Analisis tecnico profundo
6. **Krebs on Security** - `https://krebsonsecurity.com/feed/` - Periodismo investigativo
7. **The CyberWire** - `https://thecyberwire.com/feeds/rss.xml` - Resumen diario conciso
8. **CISA Advisories** - `https://www.cisa.gov/cybersecurity-advisories/all.xml` - Alertas oficiales US
9. **PortSwigger Blog** - `https://portswigger.net/blog/rss` - Investigacion seguridad web
10. **Threatpost** - `https://threatpost.com/feed/` - Vulnerabilidades y amenazas
11. **Infosecurity Magazine** - `http://www.infosecurity-magazine.com/rss/news/` - Revista digital infosec
12. **Malwarebytes Blog** - `https://www.malwarebytes.com/blog/feed/` - Analisis de malware
13. **Help Net Security** - `https://www.helpnetsecurity.com/feed/` - Enterprise security
14. **CSO Online** - `https://www.csoonline.com/feed/` - Para CISOs y lideres
15. **The Record** - `https://therecord.media/feed/` - Periodismo de ciberseguridad

### Estrategia de Contenido LinkedIn
- **Formato ganador**: Posts de texto (2.9-4.8% engagement), carruseles (6.6%), documentos (6.1%)
- **Longitud optima**: 1,300-1,600 caracteres
- **Hook critico**: Solo 210 caracteres visibles antes de "ver mas"
- **Hashtags**: 3-5 por post; #cybersecurity #infosec #ransomware #zerotrust #threatintel
- **Mejor timing**: Martes-Jueves 10am-12pm; Miercoles 4pm mejor slot
- **Frecuencia**: Minimo 2 posts/semana; optimo 3-5/semana
- **Tono**: Experto accesible, tecnico pero comprensible, storytelling + datos
- **Estructura ideal**: Hook poderoso + Contexto/Valor + CTA + Hashtags

### Tipos de Posts que Funcionan
1. **Newsjack / Resumen de Noticia**: Noticia caliente + analisis + takeaways
2. **Lista de Tips**: "5 cosas que...", "3 errores que..."
3. **Storytelling**: Experiencia personal, leccion aprendida
4. **Contrarian Take**: Opinion contraria respaldada con datos
5. **Quick Stat**: Dato impactante + contexto + implicaciones
6. **Thread / Hilo**: Analisis profundo paso a paso

### Stack Tecnologico Recomendado
- Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Parsing RSS: `rss-parser` (npm)
- IA: API de OpenAI/Anthropic para generacion de posts
- Cache: LocalStorage/SessionStorage para MVP
- Nota: Backend full-stack NO es posible en sandbox; usar datos mock con funcionalidad completa en frontend

### Funcionalidades Requeridas
1. **Dashboard de Noticias**: Mostrar noticias agregadas de multiples fuentes RSS
2. **Clasificacion**: Ranking por relevancia, fecha, fuente
3. **Generador de Posts**: IA que genere posts para LinkedIn a partir de una noticia
4. **Vista Previa**: Preview de como se vera el post en LinkedIn
5. **Editor**: Permitir editar el post generado
6. **Historial**: Guardar posts generados previamente
7. **Fuentes Configurables**: Activar/desactivar fuentes RSS
