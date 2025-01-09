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

    // Obtener valores en UTC
    const dia = date.getUTCDate().toString().padStart(2, '0');
    const mes = meses[date.getUTCMonth()];
    const anio = date.getUTCFullYear();

    return `${dia} ${mes} ${anio}`;
}

// Cargar datos del último partido
async function loadLastMatch() {
  try {
    // Obtener el último partido jugado
    const { data: lastMatch, error: matchError } = await supabase
      .from("partidos")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(1)
      .single();

    if (matchError) throw matchError;

    if (!lastMatch) {
      console.log("No hay partidos registrados.");
      return;
    }

    // Formatear y mostrar fecha y lugar en el header
    const formattedDate = formatDate(new Date(lastMatch.fecha)); // Formatear la fecha
    document.querySelector(".date").textContent = formattedDate;
    document.querySelector(".location").textContent = lastMatch.lugar;

    // Obtener los jugadores del partido
    const { data: participations, error: participationError } = await supabase
      .from("participaciones")
      .select("id_jugador, equipo, jugadores(nombre)")
      .eq("id_partido", lastMatch.id_partido);

    if (participationError) throw participationError;

    if (!participations.length) {
      console.log("No se encontraron participaciones para este partido.");
      return;
    }

    // Separar jugadores por equipo
    const team1 = participations.filter(p => p.equipo === 1);
    const team2 = participations.filter(p => p.equipo === 2);

    // Renderizar jugadores en el DOM
    const renderTeam = (team, teamSelector) => {
      const tbody = document.querySelector(`${teamSelector} tbody`);
      tbody.innerHTML = ""; // Limpiar contenido anterior
      team.forEach((player, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${player.jugadores.nombre}</td>
          <td><button class="info-button">+</button></td>
        `;
        tbody.appendChild(row);
      });
    };

    renderTeam(team1, ".team:first-child");
    renderTeam(team2, ".team:last-child");
  } catch (err) {
    console.error("Error al cargar los datos del último partido:", err.message);
  }
}

// Cargar datos al inicio
document.addEventListener("DOMContentLoaded", loadLastMatch);

async function loadMatchButtons() {
    const { data: partidos, error } = await supabase
      .from("partidos")
      .select("*")
      .order("fecha", { ascending: true });
  
    if (error) {
      console.error("Error al cargar los partidos:", error.message);
      return;
    }
  
    const buttonsContainer = document.querySelector(".match-buttons");
    buttonsContainer.innerHTML = ""; // Limpia los botones previos
  
    partidos.forEach((partido, index) => {
      const button = document.createElement("button");
      button.classList.add("match-button");
      button.textContent = `F${index + 1}`;
      button.addEventListener("click", () => {
        loadMatchData(partido.id_partido);
        highlightSelectedButton(button);
      });
  
      // Destacar el botón correspondiente al partido mostrado inicialmente
      if (partido.id_partido === currentMatchId) {
        button.classList.add("selected");
      }
  
      buttonsContainer.appendChild(button);
    });
  }
  
  function highlightSelectedButton(selectedButton) {
    // Eliminar la clase 'selected' de todos los botones
    document.querySelectorAll(".match-button").forEach((btn) => {
      btn.classList.remove("selected");
    });
  
    // Agregar la clase 'selected' al botón seleccionado
    selectedButton.classList.add("selected");
  }
  
  
  // Cargar datos de un partido específico
  async function loadMatchData(matchId) {
    try {
      // Obtener detalles del partido seleccionado
      const { data: match, error: matchError } = await supabase
        .from("partidos")
        .select("*")
        .eq("id_partido", matchId)
        .single();
  
      if (matchError) throw matchError;
  
      // Actualizar fecha y lugar
      // Formatear y mostrar fecha y lugar en el header
        const formattedDate = formatDate(new Date(match.fecha)); // Formatear la fecha
      document.querySelector(".date").textContent = formattedDate;
      document.querySelector(".location").textContent = match.lugar;
  
      // Obtener los jugadores del partido
      const { data: participations, error: participationError } = await supabase
        .from("participaciones")
        .select("id_jugador, equipo, jugadores(nombre)")
        .eq("id_partido", matchId);
  
      if (participationError) throw participationError;
  
      // Separar jugadores por equipo
      const team1 = participations.filter(p => p.equipo === 1);
      const team2 = participations.filter(p => p.equipo === 2);
  
      // Renderizar jugadores
      const renderTeam = (team, teamSelector) => {
        const tbody = document.querySelector(`${teamSelector} tbody`);
        tbody.innerHTML = "";
        team.forEach((player, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.jugadores.nombre}</td>
            <td><button class="info-button">+</button></td>
          `;
          tbody.appendChild(row);
        });
      };
  
      renderTeam(team1, ".team:first-child");
      renderTeam(team2, ".team:last-child");
    } catch (err) {
      console.error("Error al cargar los datos del partido seleccionado:", err.message);
    }
  }
  
  // Cargar datos iniciales al inicio
  document.addEventListener("DOMContentLoaded", async () => {
    await loadMatchButtons(); // Cargar botones
    await loadLastMatch();    // Cargar datos del último partido por defecto
  });

let currentMatchId = null;

async function loadInitialData() {
  const { data: ultimoPartido } = await supabase
    .from("partidos")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(1)
    .single();

  if (ultimoPartido) {
    currentMatchId = ultimoPartido.id_partido;
    loadMatchData(currentMatchId); // Cargar datos del último partido
    loadMatchButtons(); // Cargar los botones
  }
}

loadInitialData();

  