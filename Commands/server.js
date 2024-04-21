const fs = require('fs');
const Discord = require("discord.js");
const config = require("../config.json");


var embed_pubing = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_AlreadyPubing_title}**`)
    .setDescription(config.m_AlreadyPubing_description)
    .setFooter({text: config.m_AlreadyPubing_footer})
    .setColor(config.embedColor)

var embed_token_invalid = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_token_invalide_title}**`)
    .setDescription(config.m_token_invalid_description)
    .addFields({name: `Utilisation de la commande :`, value: `${config.prefix}pub tokendevotrebot`})
    .setColor(config.embedColor)

var embed_pub_s1_stopped = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_pub_s1_stopped}**`)
    .setFooter({text: "Vous pouvez recommencer une publicité dès maintenant"})
    .setColor(config.embedColor)

var embed_pub_time_stop = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_pub_time_stop_title}**`)
    .setFooter({text: config.m_pub_time_stop_description})
    .setColor(config.embedColor)
var newClient = {}

module.exports = {
    run: async (client, message, args, prefix) => {
        if (!message.member.roles.cache.get(config.wlrole)) return;

        newClient[message.channel.id] = new Discord.Client({intents: [Object.keys(Discord.GatewayIntentBits)]});

        newClient[message.channel.id].login(args[0]).catch(err => {message.channel.send({embeds: [embed_token_invalid]})})

        newClient[message.channel.id].on("ready", async () => {
            let is = 1;
            let isss = 0;
            let srv = {};
            let servers = [];
    
    
            newClient[message.channel.id].guilds.cache.forEach(gu => {
                servers += `**[${is}]** - **${gu.name}** (${gu.memberCount} membres)\n`
                isss += gu.memberCount;
                srv[is] = gu.id;
                is++;
            })
            let s1;
            if(servers.length >= 1500){
                let p = 1500 - servers.length
                if (p < 0) p = p * (-1);
            
                if (servers.length >= 1500) servers = servers.substring(0, servers.length - p)
                s1 = new Discord.EmbedBuilder()
                    .setTitle("**Choisissez le serveur où votre publicité sera envoyée**")
                    .setDescription(`${servers} \nTrop de serveur à afficher\n\nRéagissez avec 🔍 pour voir les informations d'un serveur.\nRéagissez avec ❌ pour quitter un serveur.`)
                    .setColor("2c2f33")
                    .setFooter({text: "Vous avez 60 secondes pour choisir le serveur."})
                
            } else {
                s1 = new Discord.EmbedBuilder()
                    .setTitle("**Choisissez le serveur où votre publicité sera envoyée**")
                    .setDescription(`${servers}\n\nRéagissez avec 🔍 pour voir les informations d'un serveur.\nRéagissez avec ❌ pour quitter un serveur.`)
                    .setColor("2c2f33")
                    .setFooter({text: "Vous avez 60 secondes pour choisir le serveur."})
            }

            let isStopped = false;
            let a1 = await message.channel.send({embeds: [s1]})
            a1.react("🔍")
            a1.react("❌")

            let stopDEB = a1.createReactionCollector({filter: (reaction, user) => user.id === message.author.id});
            stopDEB.on("collect", async(reaction, user) => {
                if(reaction.emoji.name === "❌") {
                    message.channel.send({embeds: [embed_pub_s1_stopped]})
                    newClient[message.channel.id].destroy()
                    isStopped = true
                }
                else if (reaction.emoji.name === "🔍"){
                    message.channel.send("Veuillez fournir le numéro du serveur que vous souhaitez afficher. (par exemple, 1)")
                    a1.channel.awaitMessages({filter: m => m.author.id == message.author.id, max: 1, time: 60000, errors: ['time'] })
                    .then(async collected => {
                        if (isStopped) return;
                        let pubs = newClient[message.channel.id].guilds.cache.get(srv[collected.first().content])
                        if (!pubs){
                            message.channel.send({embeds: [new Discord.EmbedBuilder().setDescription(":x: Impossible de trouver le serveur, veuillez réessayer.")]})
                            return newClient[message.channel.id].destroy()
                        }
                        const invite = await pubs.channels.cache.filter(channel => channel.type === 0).random()?.createInvite({ maxAge: 0, maxUses: 0, unique: true, }).catch(() => false);
                        const embed = new Discord.EmbedBuilder()
                            .setTitle("Informations du serveur")
                            .setThumbnail(pubs.iconURL({dynamic: true}))
                            .setAuthor({name: pubs.name, iconURL: pubs.iconURL({dynamic: true})})
                            .addFields({ name: "**🤖 Name :**", value: `\`\`\`${pubs.name}\`\`\``, inline: true })
                            .addFields({ name: "**🛠️ ID :**", value: `\`\`\`${pubs.id}\`\`\``, inline: true })
                            .addFields({ name: "**👤 Membres:**", value: `\`\`\`${pubs.memberCount}\`\`\``, inline: true })
                            .addFields({ name: "**💭 Channels :**", value: `\`\`\`${pubs.channels.cache.size}\`\`\``, inline: true })
                            .addFields({ name: "**👥 Rôles :**", value: `\`\`\`${pubs.roles.cache.size}\`\`\``, inline: true })
                            .addFields({ name: "**🤖 Bots :**", value: `\`\`\`${pubs.members.cache.filter(m => m.user.bot).size}\`\`\``, inline: true })
                            .addFields({ name: "**🛠️ Admins :**", value: `\`\`\`${pubs.members.cache.filter(m => m.permissions.has(Discord.PermissionsBitField.Flags.Administrator)).size}\`\`\``, inline: true })
                            .addFields({ name: "**🖼️ Icon Link :**", value: `${pubs.icon ? `[Image](${pubs.iconURL({dynamic: true})})` : "No Icon"}`, inline: true })
                            .addFields({ name: "**🔗 Invite Link :**", value: `[Lien](${invite ?? "Pas la permission de crée une invitation"})`, inline: true })
                            .addFields({ name: "**Date de création du bot**", value: `<t:${Math.round(newClient[message.channel.id].user.createdAt / 1000)}:D>`, inline: true })
                            .setColor(config.embedColor)
                        await message.channel.send({embeds: [embed]})
                        return newClient[message.channel.id].destroy()
                    })
                }
            });
        })
    }
}

module.exports.help = {
  name: 'server',
  description: 'Cette commande sert à voir tout les serveurs où est le bot.',
  category: "autres",
  token: true,
  wl: true
}