// URL y clave de la base de datos Supabase
const SUPABASE_URL = "https://eomttchuxzmvtwjacvtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbXR0Y2h1eHptdnR3amFjdnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMzg3MzQsImV4cCI6MjA1MTkxNDczNH0.QheCAaDo0BsF0jfL2vo52m29FWGUAR0TpzHnPySSj9c";

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Función para formatear la fecha
function formatDate(date) {
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const dia = date.getUTCDate().toString().padStart(2, '0');
  const mes = meses[date.getUTCMonth()];
  const anio = date.getUTCFullYear();
  return `${dia} ${mes} ${anio}`;
}

// Cargar datos del último partido
async function loadLastMatch() {
  try {
    const { data: lastMatch, error: matchError } = await supabase
      .from("partidos")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(1)
      .single();

    if (matchError) throw matchError;
    if (!lastMatch) return console.log("No hay partidos registrados.");

    // Formatear y mostrar fecha y lugar
    document.querySelector(".date").textContent = formatDate(new Date(lastMatch.fecha));
    document.querySelector(".location").textContent = lastMatch.lugar;

    // Cargar jugadores
    await loadPlayersForMatch(lastMatch.id_partido);

    // Actualizar el indicador de equipos según el resultado
    updateTeamIndicators(lastMatch.resultado);

    // Seleccionar el botón correspondiente al último partido
    await selectLastMatchButton(lastMatch.id_partido);

  } catch (err) {
    console.error("Error al cargar el último partido:", err.message);
  }
}

// Cargar jugadores de un partido específico
async function loadPlayersForMatch(matchId) {
    try {
      const { data: lastMatch, error: matchError } = await supabase
        .from("partidos")
        .select("*")
        .eq("id_partido", matchId)
        .single();
  
      if (matchError) throw matchError;
  
      // Formatear y mostrar la nueva fecha y lugar
      document.querySelector(".date").textContent = formatDate(new Date(lastMatch.fecha));
      document.querySelector(".location").textContent = lastMatch.lugar;
  
      // Cargar jugadores
      const { data: participations, error: participationError } = await supabase
        .from("participaciones")
        .select("id_jugador, equipo, jugadores(nombre)")
        .eq("id_partido", matchId);
  
      if (participationError) throw participationError;
  
      // Limpiar las listas de jugadores anteriores antes de cargar nuevos
      clearTeams();
  
      if (!participations || participations.length === 0) {
        console.log("No se encontraron jugadores para este partido.");
        return;
      }
  
      // Filtrar los jugadores por equipo
      const team1 = participations.filter(p => p.equipo === 1);
      const team2 = participations.filter(p => p.equipo === 2);
  
      renderTeam(team1, ".team:first-child");
      renderTeam(team2, ".team:last-child");
  
      // Actualizar el indicador de equipos según el resultado
      updateTeamIndicators(lastMatch.resultado);
  
    } catch (err) {
      console.error("Error al cargar jugadores:", err.message);
    }
  }

// Limpiar las listas de jugadores
function clearTeams() {
  document.querySelectorAll(".team tbody").forEach((tbody) => {
    tbody.innerHTML = ""; // Limpiar el contenido de cada equipo
  });
}

// Renderizar los jugadores de un equipo
function renderTeams(team1, team2) {
  const tbody1 = document.querySelector(".team:first-child tbody");
  const tbody2 = document.querySelector(".team:last-child tbody");

  tbody1.innerHTML = "";
  tbody2.innerHTML = "";

  const maxPlayers = Math.max(team1.length, team2.length);

  for (let i = 0; i < maxPlayers; i++) {
      // Agregar jugador al equipo 1 o colocar "--" si no hay más jugadores
      const row1 = document.createElement("tr");
      if (i < team1.length) {
          row1.innerHTML = `
              <td>${i + 1}</td>
              <td>${team1[i].jugadores.nombre}</td>
              <td><button class="info-button">+</button></td>
          `;
      } else {
          row1.innerHTML = `
              <td>${i + 1}</td>
              <td>--</td>
              <td><button class="info-button">x</button></td>
          `;
      }
      tbody1.appendChild(row1);

      // Agregar jugador al equipo 2 o colocar "--" si no hay más jugadores
      const row2 = document.createElement("tr");
      if (i < team2.length) {
          row2.innerHTML = `
              <td>${i + 1}</td>
              <td>${team2[i].jugadores.nombre}</td>
              <td><button class="info-button">+</button></td>
          `;
      } else {
          row2.innerHTML = `
              <td>${i + 1}</td>
              <td>--</td>
              <td><button class="info-button">x</button></td>
          `;
      }
      tbody2.appendChild(row2);
  }
}

// Modificar loadPlayersForMatch para usar renderTeams
async function loadPlayersForMatch(matchId) {
  try {
      const { data: participations, error: participationError } = await supabase
          .from("participaciones")
          .select("id_jugador, equipo, jugadores(nombre)")
          .eq("id_partido", matchId);

      if (participationError) throw participationError;

      const team1 = participations.filter(p => p.equipo === 1);
      const team2 = participations.filter(p => p.equipo === 2);

      renderTeams(team1, team2);
  } catch (err) {
      console.error("Error al cargar jugadores:", err.message);
  }
}

// Asignar las clases según el resultado
function updateTeamIndicators(result) {
  // Restablecer clases antes de agregar las nuevas
  document.getElementById("team1-indicator").classList.remove("winner", "loser", "draw", "unplayed");
  document.getElementById("team2-indicator").classList.remove("winner", "loser", "draw", "unplayed");

  // Asignar las clases según el resultado
  if (result > 0) {  // Equipo 1 gana
    document.getElementById("team1-indicator").classList.add("winner");
    document.getElementById("team2-indicator").classList.add("loser");
  } else if (result === 0) {  // Empate
    document.getElementById("team1-indicator").classList.add("draw");
    document.getElementById("team2-indicator").classList.add("draw");
  } else if (result === -999) {  // Empate
    document.getElementById("team1-indicator").classList.add("unplayed");
    document.getElementById("team2-indicator").classList.add("unplayed");
  } else {  // Equipo 2 gana
    document.getElementById("team1-indicator").classList.add("loser");
    document.getElementById("team2-indicator").classList.add("winner");
  }
}

// Cargar los botones de partidos
async function loadMatchButtons() {
  try {
    const { data: partidos, error } = await supabase
      .from("partidos")
      .select("*")
      .order("fecha", { ascending: true });

    if (error) throw error;
    const buttonsContainer = document.querySelector(".match-buttons");
    buttonsContainer.innerHTML = ""; // Limpiar los botones previos

    partidos.forEach((partido, index) => {
      const button = document.createElement("button");
      button.classList.add("match-button");
      button.textContent = `F${index + 1}`;
      button.addEventListener("click", () => {
        loadPlayersForMatch(partido.id_partido); // Cambiado a loadPlayersForMatch
        highlightSelectedButton(button);
        updateTeamIndicators(partido.resultado); // Actualizar indicadores al cambiar de partido
      });
      buttonsContainer.appendChild(button);
    });
  } catch (err) {
    console.error("Error al cargar los botones de partidos:", err.message);
  }
}

// Resaltar el botón seleccionado
function highlightSelectedButton(selectedButton) {
  document.querySelectorAll(".match-button").forEach((btn) => {
    btn.classList.remove("selected");
  });
  selectedButton.classList.add("selected");
}

// Seleccionar el botón correspondiente al último partido cargado
async function selectLastMatchButton(lastMatchId) {
  const { data: partidos, error } = await supabase
    .from("partidos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) throw error;

  // Encontrar el índice del último partido
  const lastMatchIndex = partidos.findIndex(partido => partido.id_partido === lastMatchId);
  const lastMatchButton = document.querySelectorAll(".match-button")[lastMatchIndex];

  if (lastMatchButton) {
    highlightSelectedButton(lastMatchButton);
  }
}

// Navegar al partido anterior
async function navigateToPrevMatch() {
  const currentMatchButton = document.querySelector(".match-button.selected");
  const prevButton = currentMatchButton.previousElementSibling;

  if (prevButton) {
    prevButton.click(); // Simula el clic en el botón del partido anterior
  }
}

// Navegar al siguiente partido
async function navigateToNextMatch() {
  const currentMatchButton = document.querySelector(".match-button.selected");
  const nextButton = currentMatchButton.nextElementSibling;

  if (nextButton) {
    nextButton.click(); // Simula el clic en el botón del siguiente partido
  }
}

// Cargar los datos iniciales
document.addEventListener("DOMContentLoaded", () => {
  const prevButton = document.querySelector(".icon-button:first-child");
  const nextButton = document.querySelector(".icon-button:last-child");

  if (prevButton) {
    prevButton.addEventListener("click", navigateToPrevMatch);  // Flecha izquierda
  }

  if (nextButton) {
    nextButton.addEventListener("click", navigateToNextMatch);   // Flecha derecha
  }

  loadMatchButtons(); // Cargar botones F1, F2, ...
  loadLastMatch();    // Cargar datos del último partido por defecto
});

// Redireccion a otro HTML
document.getElementById("playersIcon").addEventListener("click", function() {
  window.location.href = "players.html";
});
