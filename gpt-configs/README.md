# 📁 Configuraciones de GPTs Personalizados

Esta carpeta contiene las configuraciones JSON de los GPTs personalizados que usamos en el sistema.

## 📋 Formato del JSON

Cada GPT debe tener un archivo JSON con esta estructura:

```json
{
  "id": "nombre-corto-del-gpt",
  "name": "Nombre Completo del GPT",
  "description": "Descripción de qué hace este GPT",
  "systemPrompt": "[PEGAR AQUÍ EL SYSTEM PROMPT DEL EDITOR DEL GPT]",
  "conversationStarters": [
    "Ejemplo de pregunta 1",
    "Ejemplo de pregunta 2",
    "Ejemplo de pregunta 3"
  ],
  "capabilities": {
    "webBrowsing": false,
    "dalleImageGeneration": false,
    "codeInterpreter": false
  },
  "settings": {
    "temperature": 0.7,
    "maxTokens": 500
  },
  "examples": [
    {
      "input": "Ejemplo de input",
      "output": "Ejemplo de output esperado"
    }
  ]
}
```

## 📤 Cómo Importar un Nuevo GPT

1. Crea un archivo JSON en esta carpeta: `nombre-del-gpt.json`
2. Ejecuta: `node scripts/import-gpt-config.js nombre-del-gpt.json`
3. El sistema lo agregará automáticamente a los generadores disponibles

## 📝 GPTs Disponibles

- [ ] `gpt-cinco-optimizer.json` - PENDIENTE
- [ ] Agregar más según necesites...
