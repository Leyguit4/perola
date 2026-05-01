// api/user/[userId].js
// Vercel Function — busca avatar e nome do usuário via Discord REST API

const GUILD_ID = "594296025561169926";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { userId } = req.query;
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    return res.status(500).json({ error: "BOT_TOKEN não configurado" });
  }

  if (!userId) {
    return res.status(400).json({ error: "userId não informado" });
  }

  let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
  let username = userId;
  let found = false;

  try {
    // Tenta buscar membro do servidor (tem avatar de servidor + apelido)
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );

    if (memberRes.ok) {
      const member = await memberRes.json();
      found = true;
      username = member.nick || member.user?.global_name || member.user?.username || userId;

      if (member.avatar) {
        avatarUrl = `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${userId}/avatars/${member.avatar}.png?size=256`;
      } else if (member.user?.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${member.user.avatar}.png?size=256`;
      }
    } else {
      // Fallback: busca usuário global
      const userRes = await fetch(
        `https://discord.com/api/v10/users/${userId}`,
        { headers: { Authorization: `Bot ${botToken}` } }
      );

      if (userRes.ok) {
        const user = await userRes.json();
        found = true;
        username = user.global_name || user.username || userId;
        if (user.avatar) {
          avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=256`;
        }
      }
    }
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
  }

  return res.status(200).json({ avatarUrl, username, found });
}
