const cidadeInput = document.getElementById("cidadeInput");
const buscarBtn = document.getElementById("buscarBtn");
const mensagem = document.getElementById("mensagem");
const resultado = document.getElementById("resultado");

const cidadeNome = document.getElementById("cidadeNome");
const temperaturaAtual = document.getElementById("temperaturaAtual");
const ventoAtual = document.getElementById("ventoAtual");
const previsaoLista = document.getElementById("previsaoLista");

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.style.color = erro ? "#b91c1c" : "#1d4ed8";
}

function limparResultado() {
  resultado.classList.add("hidden");
  previsaoLista.innerHTML = "";
}

function formatarData(dataISO) {
  const data = new Date(`${dataISO}T12:00:00`);
  return data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
}

async function buscarCoordenadas(cidade) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar a cidade.");
  }

  const dados = await resposta.json();

  if (!dados.results || dados.results.length === 0) {
    throw new Error("Cidade não encontrada.");
  }

  return dados.results[0];
}

async function buscarClima(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar os dados do clima.");
  }

  return resposta.json();
}

function renderizarClima(local, clima) {
  cidadeNome.textContent = `${local.name}${local.admin1 ? `, ${local.admin1}` : ""}${local.country ? ` - ${local.country}` : ""}`;
  temperaturaAtual.textContent = `${Math.round(clima.current.temperature_2m)}°C`;
  ventoAtual.textContent = `Vento: ${Math.round(clima.current.wind_speed_10m)} km/h`;

  previsaoLista.innerHTML = "";

  clima.daily.time.forEach((dia, index) => {
    const item = document.createElement("div");
    item.className = "item-previsao";

    item.innerHTML = `
      <strong>${formatarData(dia)}</strong>
      <span>Máx: ${Math.round(clima.daily.temperature_2m_max[index])}°C</span>
      <span>Mín: ${Math.round(clima.daily.temperature_2m_min[index])}°C</span>
    `;

    previsaoLista.appendChild(item);
  });

  resultado.classList.remove("hidden");
}

async function consultarClima() {
  const cidade = cidadeInput.value.trim();

  if (!cidade) {
    mostrarMensagem("Digite uma cidade.", true);
    limparResultado();
    return;
  }

  try {
    mostrarMensagem("Buscando dados...");
    limparResultado();

    const local = await buscarCoordenadas(cidade);
    const clima = await buscarClima(local.latitude, local.longitude);

    renderizarClima(local, clima);
    mostrarMensagem("Consulta realizada com sucesso.");
  } catch (error) {
    mostrarMensagem(error.message, true);
    limparResultado();
  }
}

buscarBtn.addEventListener("click", consultarClima);

cidadeInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    consultarClima();
  }
});