const GUILD_ID = "594296025561169926";

const EMOJIS = [
  "<:useravatar:1499273677491929088>",
  "<:info:1287136395470704692>",
  "<:calendar:1253453437295788163>",
  "<:cloudyday:1499275411853545493>",
  "<:thumbtack:1253523157227147329>",
  "<:useravatar1:1499277321927131146>",
  "<:Question:1337301791150313484>",
];

const PERGUNTAS = [
  "Conte mais sobre você?",
  "Sua idade?",
  "Dias que geralmente tem disponibilidade?",
  "Qual é a sua disponibilidade?",
  "Qual setor deseja ingressar?",
  "Tem alguma experiência nessa(s) área?",
  "Porque deseja entrar na equipe e qual o intuito com isso?",
];

async function getAvatarUrl(userId, botToken) {
  try {
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    if (memberRes.ok) {
      const member = await memberRes.json();
      if (member.avatar) return `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${userId}/avatars/${member.avatar}.png?size=256`;
      if (member.user?.avatar) return `https://cdn.discordapp.com/avatars/${userId}/${member.user.avatar}.png?size=256`;
    }
    const userRes = await fetch(
      `https://discord.com/api/v10/users/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    if (userRes.ok) {
      const user = await userRes.json();
      if (user.avatar) return `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=256`;
    }
  } catch (_) {}
  return "https://cdn.discordapp.com/embed/avatars/0.png";
}

function buildDiscordPayload(userId, respostas, avatarUrl) {
  const linhas = PERGUNTAS
    .map((pergunta, index) => {
      if (index === 5 && (!respostas[index] || respostas[index].trim() === "")) return null;
      return `${EMOJIS[index]} **${pergunta}**\n- ${respostas[index] || "Não respondido"}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const content =
    `## <:Form:1337301708568526869> Formulário de <@${userId}>\n\n` +
    linhas +
    `\n\n<:usercopy:1278003096873861271> **ID do Membro:**\n\`\`\`${userId}\`\`\``;

  return {
    flags: 1 << 15,
    components: [
      {
        type: 17,
        components: [
          {
            type: 25,
            components: [{ type: 10, content }],
            accessory: {
              type: 11,
              media: { url: avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png" }
            }
          }
        ]
      }
    ]
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Método não permitido" });

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return res.status(500).json({ success: false, error: "BOT_TOKEN não configurado no Vercel" });

  const channelId = process.env.RESPONSE_CHANNEL_ID;
  if (!channelId) return res.status(500).json({ success: false, error: "RESPONSE_CHANNEL_ID não configurado no Vercel" });

  const { userId, respostas } = req.body || {};
  if (!userId || !respostas) return res.status(400).json({ success: false, error: "Dados incompletos" });

  const respostasArray = [
    respostas.resposta1 || "",
    respostas.resposta2 || "",
    respostas.resposta3 || "",
    respostas.resposta4 || "",
    respostas.resposta5 || "",
    respostas.resposta6 || "",
    respostas.resposta7 || "",
  ];

  const avatarUrl = await getAvatarUrl(userId, botToken);
  const payload = buildDiscordPayload(userId, respostasArray, avatarUrl);

  try {
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord API error:", discordRes.status, errText);
      return res.status(500).json({ success: false, error: `Discord API: ${discordRes.status}` });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
