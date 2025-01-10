// URL y clave de la base de datos Supabase
const SUPABASE_URL = "https://eomttchuxzmvtwjacvtt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbXR0Y2h1eHptdnR3amFjdnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMzg3MzQsImV4cCI6MjA1MTkxNDczNH0.QheCAaDo0BsF0jfL2vo52m29FWGUAR0TpzHnPySSj9c";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    async function cargarJugadores() {
        try {
            // Consultar jugadores, partidos y participaciones
            const { data: jugadores, error: errorJugadores } = await client
                .from('jugadores')
                .select('*');
            
            const { data: partidos, error: errorPartidos } = await client
                .from('partidos')
                .select('*');

            const { data: participaciones, error: errorParticipaciones } = await client
                .from('participaciones')
                .select('*');

            if (errorJugadores || errorPartidos || errorParticipaciones) {
                console.error('Error al cargar datos:', errorJugadores || errorPartidos || errorParticipaciones);
                return;
            }

            // Crear un mapa para almacenar estadísticas por jugador
            const estadisticas = {};

            jugadores.forEach(jugador => {
                estadisticas[jugador.id_jugador] = {
                    nombre: jugador.nombre,
                    pj: 0,  // Partidos jugados
                    g: 0,   // Partidos ganados
                    e: 0,   // Partidos empatados
                    p: 0,   // Partidos perdidos
                    difGol: 0 // Diferencia de gol
                };
            });

            // Calcular estadísticas
            partidos.forEach(partido => {
                const resultado = partido.resultado;
                let equipoGanador = null;

                if (resultado > 0) equipoGanador = 1;
                else if (resultado < 0) equipoGanador = 2;

                const participantesPartido = participaciones.filter(p => p.id_partido === partido.id_partido);

                participantesPartido.forEach(participacion => {
                    const idJugador = participacion.id_jugador;
                    const equipo = participacion.equipo;

                    estadisticas[idJugador].pj += 1;

                    if (equipoGanador === null) {
                        estadisticas[idJugador].e += 1; // Empate
                    } else if (equipoGanador === equipo) {
                        estadisticas[idJugador].g += 1; // Ganado
                        estadisticas[idJugador].difGol += Math.abs(resultado); // Sumar diferencia de gol
                    } else {
                        estadisticas[idJugador].p += 1; // Perdido
                        estadisticas[idJugador].difGol -= Math.abs(resultado); // Restar diferencia de gol
                    }
                });
            });

            // Ordenar jugadores por partidos ganados y luego por id_jugador
            const jugadoresOrdenados = Object.entries(estadisticas)
                .sort(([, a], [, b]) => 
                    b.g - a.g ||        // Primero, partidos ganados
                    b.e - a.e ||        // Segundo, partidos empatados
                    b.pj - a.pj ||      // Tercero, partidos jugados
                    b.difGol - a.difGol ||      // Cuarto, diferencia de gol
                    a.id - b.id         // Quinto, id del jugador
                );

            // Generar HTML de la tabla
            const tbody = document.querySelector('tbody');
            tbody.innerHTML = '';

            jugadoresOrdenados.forEach(([id, stats], index) => {
                const rachaHTML = generarRacha(parseInt(id), participaciones, partidos);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${stats.nombre}</td>
                    <td>${rachaHTML}</td>
                    <td>${stats.pj}</td>
                    <td>${stats.g}</td>
                    <td>${stats.e}</td>
                    <td>${stats.p}</td>
                    <td>${stats.difGol}</td>
                `;
                tbody.appendChild(row);
            });

        } catch (error) {
            console.error('Error al cargar jugadores:', error);
        }
    }

    function generarRacha(idJugador, participaciones, partidos) {
        // Filtrar los partidos del jugador y ordenarlos por fecha
        const participacionesJugador = participaciones
            .filter(p => p.id_jugador === idJugador)
            .sort((a, b) => {
                const partidoA = partidos.find(partido => partido.id_partido === a.id_partido);
                const partidoB = partidos.find(partido => partido.id_partido === b.id_partido);
                return new Date(partidoA.fecha) - new Date(partidoB.fecha);
            });
    
        // Tomar los últimos 5 partidos
        const ultimosCinco = participacionesJugador.slice(-5);
    
        // Generar los círculos de colores
        const circulos = ultimosCinco.map(participacion => {
            const partido = partidos.find(p => p.id_partido === participacion.id_partido);
            const resultado = partido.resultado;
            const equipo = participacion.equipo;
    
            let color = '#ffc107'; // Empate por defecto
            let wdl = 'E';
            if (resultado > 0 && equipo === 1 || resultado < 0 && equipo === 2) {
                color = '#28a745'; // Ganó
                wdl = 'V';
            } else if (resultado < 0 && equipo === 1 || resultado > 0 && equipo === 2) {
                color = '#dc3545'; // Perdió
                wdl = 'P';
            }
    
            return `<span style="display:inline-block; width: 18px; height: 18px; border-radius: 20%; background-color: ${color}; margin: 0 2px; font-size: 0.7em; text-align: center; line-height: 18px;">${wdl}</span>`;
        }).join('');
    
        // Retornar los círculos envueltos en un contenedor alineado a la derecha
        return `<div style="text-align: right;">${circulos}</div>`;
    }

    // Llamar a la función para cargar los jugadores al iniciar la página
    cargarJugadores();
});
