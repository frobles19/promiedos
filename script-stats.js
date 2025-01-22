// URL y clave de la base de datos Supabase
const SUPABASE_URL = "https://eomttchuxzmvtwjacvtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbXR0Y2h1eHptdnR3amFjdnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMzg3MzQsImV4cCI6MjA1MTkxNDczNH0.QheCAaDo0BsF0jfL2vo52m29FWGUAR0TpzHnPySSj9c";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let players = [];
let currentPlayerIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchPlayers();
    loadCurrentPlayer();

    document.querySelectorAll('.icon-button')[0].addEventListener('click', () => {
        currentPlayerIndex = (currentPlayerIndex - 1 + players.length) % players.length;
        loadCurrentPlayer();
    });

    document.querySelectorAll('.icon-button')[1].addEventListener('click', () => {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        loadCurrentPlayer();
    });
});

async function fetchPlayers() {
    const { data, error } = await client
        .from('jugadores')
        .select('*')
        .order('id_jugador', { ascending: true });

    if (error) {
        console.error('Error fetching players:', error);
        return;
    }

    players = data;

    // Buscar jugador en la URL
    const playerId = getQueryParam('id');
    if (playerId) {
        currentPlayerIndex = players.findIndex(p => p.id_jugador == playerId);
        if (currentPlayerIndex === -1) currentPlayerIndex = 0; // Si no encuentra, muestra el primero
    }

    loadCurrentPlayer();
}

async function loadCurrentPlayer() {
    if (players.length === 0) return;

    const currentPlayer = players[currentPlayerIndex];
    document.querySelector('.player-name .name').textContent = currentPlayer.nombre;

    await loadMatches(currentPlayer.id_jugador);
}

async function loadMatches(playerId) {
    const { data: participations, error } = await client
        .from('participaciones')
        .select('id_partido, equipo')
        .eq('id_jugador', playerId);

    if (error) {
        console.error('Error fetching participations:', error);
        return;
    }

    const matchIds = participations.map(p => p.id_partido);

    const { data: matches, error: matchError } = await client
        .from('partidos')
        .select('*')
        .in('id_partido', matchIds)
        .neq('resultado', -999)
        .order('fecha', { ascending: true });

    if (matchError) {
        console.error('Error fetching matches:', matchError);
        return;
    }

    const tbody = document.querySelector('.matchs-table tbody');
    tbody.innerHTML = '';

    matches.forEach((match, index) => {
        const participation = participations.find(p => p.id_partido === match.id_partido);
        const result = getResult(match.resultado, participation.equipo);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>F${index + 1}</td>
            <td>${formatDate(new Date(match.fecha))}</td>
            <td>${match.lugar}</td>
            <td><span class="result ${result.class}" data-full="${result.text}" data-short="${result.short}">${result.text}</span></td>
            <td><button class="info-button">+</button></td>
        `;

        tbody.appendChild(row);
    });

    adjustResultText();
}

function getResult(resultado, equipo) {
    if (resultado > 0) {
        return equipo === 1 
            ? { text: `VICTORIA x${resultado}`, short: `+${resultado}`, class: 'victory' } 
            : { text: `DERROTA x${resultado}`, short: `-${resultado}`, class: 'defeat' };
    } else if (resultado < 0) {
        return equipo === 2 
            ? { text: `VICTORIA x${Math.abs(resultado)}`, short: `+${Math.abs(resultado)}`, class: 'victory' } 
            : { text: `DERROTA x${Math.abs(resultado)}`, short: `-${Math.abs(resultado)}`, class: 'defeat' };
    } else {
        return { text: 'EMPATE', short: '0', class: 'draw' };
    }
}


function formatDate(date) {
    const options = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' };
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ))).replace('.', '');
}


function adjustResultText() {
    const isSmallScreen = window.innerWidth < 570;
    document.querySelectorAll('.result').forEach(resultElement => {
        resultElement.textContent = isSmallScreen ? resultElement.dataset.short : resultElement.dataset.full;
    });
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

window.addEventListener('resize', adjustResultText);
