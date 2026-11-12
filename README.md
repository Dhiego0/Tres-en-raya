# Tres en raya 3D

Juego de tres en raya en un tablero de 3 × 3 × 3. La interfaz está hecha con HTML, CSS y JavaScript, y Three.js renderiza el tablero y sus fichas en 3D. También incluye una vista 2D por capas y modos de jugador contra IA o jugador contra jugador.

## Requisitos

- Python 3.9 o posterior para servir la web localmente.
- Node.js 20 o posterior para ejecutar las pruebas automatizadas.
- Conexión a Internet para cargar las bibliotecas y los estilos externos de CDN usados por la página.

El proyecto no necesita instalar paquetes: el juego y la IA se ejecutan en el navegador.

## Controles y preferencias

- En ordenador usa las flechas para seleccionar una casilla, `Q` / `E` para cambiar de capa y `Enter` para colocar una ficha. En móviles juega directamente con la pantalla táctil: toca una casilla para colocar y arrastra el tablero para rotarlo. Usa las pestañas de la vista 2D para elegir una capa.
- El marcador de victorias y empates, junto con el tema, modo, dificultad, formas, expansión de capas, sonidos y música, se guarda en el almacenamiento local del navegador.
- Al cambiar el modo o la dificultad en medio de una partida, el juego pide confirmación antes de reiniciarla. Los efectos de sonido y la música ambiental original, sintetizada en el navegador, vienen activados por defecto y se pueden apagar en Opciones. La música empieza después de la primera interacción porque los navegadores bloquean la reproducción automática.
- Hay cinco dificultades: Principiante (aleatoria), Fácil (1 nivel de búsqueda), Medio (2), Difícil (3) y Experto (búsqueda iterativa hasta 5 niveles con un límite de 35 000 nodos). La búsqueda acotada mantiene la respuesta ágil en móviles.
- El modo Difícil y Experto muestran un distintivo que identifica el nivel y el estilo musical activo, con color e icono propios. Cada estilo tiene además un arreglo avanzado exclusivo para esas dificultades: capas brillantes en Espacial, percusión reforzada en Pulso y arpegios ascendentes en Calma. En Opciones se puede elegir entre los tres estilos musicales originales; la selección se guarda en el navegador.
- Al ganar cualquiera de los jugadores o terminar en empate, el indicador de turno se muestra temporalmente en el centro y luego se anima hasta su posición pequeña habitual en la cabecera.
- El juego respeta la preferencia del sistema para reducir movimiento en animaciones.

## Ejecutar el juego web

Desde la carpeta del proyecto, inicia un servidor estático:

```powershell
python -m http.server 8000
```

Abre [http://localhost:8000](http://localhost:8000) en el navegador. Para detener el servidor, pulsa `Ctrl+C` en la terminal.

No abras `index.html` directamente como archivo: servirlo por HTTP evita restricciones del navegador y permite que las dependencias externas se carguen normalmente.

## Ejecutar las pruebas

Con Node.js 20 o posterior instalado, ejecuta desde la carpeta del proyecto:

```powershell
node --test
```

Las pruebas usan el ejecutor integrado de Node.js; no hace falta instalar paquetes.

## Arquitectura actual

`script.js` contiene la interfaz, las reglas y la IA con minimax y poda alfa-beta. El juego no necesita un backend ni hace peticiones de red para calcular las jugadas.

## Solución de problemas

- **No cargan los gráficos o estilos:** comprueba la conexión a Internet; Three.js, Tailwind CSS, Font Awesome y Confetti se cargan desde CDN.
- **El puerto ya está ocupado:** inicia el servidor estático con otro puerto, por ejemplo `python -m http.server 8001`.
