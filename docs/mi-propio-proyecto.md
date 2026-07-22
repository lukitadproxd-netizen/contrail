# Tu proyecto: Contrail — memoria para asistentes de IA

Esto es lo que construiste. Léelo una vez y vas a poder hablar de Contrail
como si lo hubieras codeado línea por línea (aunque no sea el caso).

---

## ¿Qué problema resuelve?

Los asistentes de IA de código (Claude Code, Cursor, Copilot, etc.)
no tienen memoria persistente. Cada conversación empieza de cero.

Hoy existen formas de darles memoria:
- Claude Code usa un archivo JSONL donde guarda preferencias
- Mem0 y Zep usan bases de datos vectoriales
- La mayoría guarda el **último valor** y se olvida del historial

**El problema:** si solo guardas el último valor, cuando hay conflictos
no puedes saber qué pasó. El asistente puede tener dos instrucciones
contradictorias y elegir una al azar, o peor, darte una respuesta
incorrecta sin avisarte.

## ¿Qué hace Contrail?

Contrail guarda la memoria de asistentes de IA como **claims**
(afirmaciones estructuradas), y cada claim nuevo puede reemplazar
("supersede") a uno anterior. Esto forma una **trayectoria**:
sabes qué se dijo, cuándo, quién lo dijo, y qué lo reemplazó.

Ejemplo real:

1. Dices: "prefiero Neovim como editor" → se guarda como claim #1
2. Luego dices: "mejor VS Code" → se guarda como claim #2,
   y explícitamente dice "esto reemplaza al claim #1"
3. El sistema sigue la cadena: claim #1 → claim #2
4. Cuando preguntas "¿qué editor prefiero?" responde "VS Code"
5. **Pero también detecta conflictos**: si alguien dice "prefiero
   Neovim" sin decir que reemplaza a nada, y ya existía "prefiero VS
   Code", Contrail te dice "hay un conflicto" en vez de elegir por
   ti o devolver silenciosamente el valor incorrecto.

Esa detección de conflictos es la clave. Ninguna solución de memoria
para IA lo hace bien hoy.

## Conceptos clave (en 2 minutos)

| Término | Qué es |
|---------|--------|
| **Claim** | Una afirmación. Tiene: sujeto, predicado, valor, confianza (0-1), fuente (quién lo dijo), y timestamps. |
| **Supersede** | Un claim puede decir "yo reemplazo a este claim anterior". Así se forma la cadena. |
| **Trayectoria** | La cadena completa de claims que se van reemplazando unos a otros. |
| **Resolución** | El proceso de seguir la cadena hasta encontrar el claim vigente. |
| **Conflicto** | Cuando dos claims hablan del mismo tema pero ninguno reemplaza al otro → Contrail avisa. |

## ¿Cómo se usa?

**Opción 1 — CLI (terminal):**
```bash
npx @contrail-spec/cli init
npx @contrail-spec/cli add preference.editor "neovim" --confidence 0.95
npx @contrail-spec/cli log preference.editor
```

**Opción 2 — MCP (para que Claude Code lo use directamente):**
Se conecta vía MCP (Model Context Protocol), el estándar que usa
Claude Code para hablar con herramientas externas. Así Claude puede
leer y escribir memoria sin que tú toques la terminal.

## Arquitectura (lo que importa)

```
@contrail-spec/core     → El motor. Valida claims con JSON Schema,
                          resuelve trayectorias, detecta conflictos.

@contrail-spec/cli      → Interfaz de terminal. init, add, log, diff.

@contrail-spec/mcp      → Servidor MCP. Permite que Claude Code
                          (y cualquier agente MCP) use Contrail
                          directamente.

@contrail-spec/engram   → Adaptador experimental a formato Engram.
                          (Engram es otro formato de memoria, esto
                          permite convertir entre ambos).
```

## ¿Por qué es diferente a Mem0, Zep, etc.?

| | Mem0 / Zep | Contrail |
|---|---|---|
| Guarda historial | ❌ Solo el último | ✅ Trayectoria completa |
| Detecta conflictos | ❌ No | ✅ Sí (MULTIPLE_HEADS) |
| Funciona sin LLM | ❌ Usan embeddings | ✅ 100% determinista |
| Rastro de fuente | ❌ No | ✅ Quién, cuándo, con qué herramienta |
| Estándar abierto | ❌ | ✅ Formato JSON Schema, MCP, JSONL |

Contrail es más limitado en algunas cosas (no busca por similitud
semántica), pero gana en transparencia y predictibilidad. No hace
llamadas a ninguna API, no necesita internet, no genera costos.

## Lo que validamos (42 tests)

- Parseo y validación de claims (JSON Schema + AJV)
- Resolución de trayectorias (cadenas, bifurcaciones, ciclos, conflictos)
- Serialización a JSONL
- CLI: init, add, log, diff
- MCP: servidor stdio, herramientas remember/recall/trajectory
- Integración real: spawn proceso MCP, handshake JSON-RPC, llamadas reales

## Lo que NO hace (a propósito)

- No tiene búsqueda semántica ni embeddings
- No usa base de datos vectorial
- No tiene API REST
- No tiene dashboard web
- No tiene cloud / SaaS
- No necesita LLM, API key, ni internet

Es una librería determinista, offline-first. Para lo que hace,
lo hace bien y predecible.

## Cómo explicarlo en 3 frases (elevator pitch)

**Versión ultra-corta (1 oración):**
"Contrail es memoria estructurada para asistentes de IA de código
que detecta conflictos en lugar de ignorarlos."

**Versión media (3 oraciones):**
"Los asistentes de IA como Claude Code no recuerdan nada entre
sesiones. Las soluciones existentes guardan el último valor y
pierden el historial, lo que causa contradicciones silenciosas.
Contrail guarda la trayectoria completa de cada preferencia y
te avisa cuando hay conflictos, en vez de elegir por vos."

**Versión técnica (para desarrolladores):**
"Contrail es un motor de memoria temporal para agentes de IA.
Modela el conocimiento como una trayectoria de claims que se
reemplazan entre sí, y resuelve el estado actual siguiendo la
cadena de supersesión. A diferencia de Mem0 o Zep, no usa
embeddings ni LLMs — es determinista, offline, y detecta
conflictos de forma explícita."

---

## Preguntas que te van a hacer (y cómo responderlas)

### "¿Por qué creaste esto?"
"Porque las soluciones de memoria para asistentes de IA
existente no detectan conflictos. Si le dices dos cosas
contradictorias a un asistente, la mayoría elige una al azar.
Contrail preserva el historial completo y avisa cuando hay
contradicciones."

### "¿Qué lo diferencia de Mem0?"
"Mem0 usa embeddings y búsqueda semántica para recuperar
memorias relevantes. Es genial para ciertos casos, pero
es frágil — depende del modelo de embeddings, tiene costos
de API, y no puede garantizar que el resultado sea correcto
porque la similitud semántica es probabilística. Contrail
es determinista: opera sobre estructura explícita, no sobre
similitud. Donde Mem0 gana en flexibilidad, Contrail gana
en predictibilidad y transparencia."

### "¿Quién debería usarlo?"
"Desarrolladores que usan asistentes de IA de código para
proyectos y quieren que el asistente recuerde sus preferencias
de manera confiable, sin depender de APIs externas ni gastar
en tokens de embeddings. Es ideal para equipos pequeños y
proyectos open source que quieren consistencia sin
infraestructura."

### "Esto compite con Claude Code Memory, ¿no?"
"Claude Code ya tiene un sistema de memoria basado en archivos
JSONL. Contrail es una alternativa mejorada: usa el mismo
formato de archivo (JSONL), se conecta vía MCP (el mismo
protocolo), pero agrega resolución de trayectorias, detección
de conflictos, y un modelo de datos más rico."

### "¿Qué tan maduro está?"
"Versión 0.2.0. El core está estable (42 tests). Los cuatro
paquetes están publicados en npm y verificados con instalación
limpia desde el registro. Pero es temprano — falta integración
con más agentes, documentación de usuario más amigable, y
adopción real."

---

## Para llevar

1. **Contrail = memoria con historial y detección de conflictos**
2. **No usa LLM, no usa embeddings, no necesita API key**
3. **Se conecta a Claude Code vía MCP**
4. **El código es determinista — mismo input = mismo output siempre**
5. **Está publicado, testeado, y funcionando**
