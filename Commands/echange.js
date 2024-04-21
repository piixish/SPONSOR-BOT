const Discord = require("discord.js");
const config = require("../config.json")
var settings = require('../pubing.js');

var embed_pubing = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_AlreadyPubing_title}**`)
    .setDescription(config.m_AlreadyPubing_description)
    .setFooter({text: config.m_AlreadyPubing_footer})
    .setColor(config.embedColor)

var embed_token_invalid = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_token_invalide_title}**`)
    .setDescription(config.m_token_invalid_description)
    .setColor(config.embedColor)

var embed_pub_s1_stopped = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_pub_s1_stopped}**`)
    .setFooter({text: "Vous pouvez recommencer une publicité dès maintenant"})
    .setColor(config.embedColor)

var embed_pub_time_stop = new Discord.EmbedBuilder()
    .setTitle(`**${config.m_pub_time_stop_title}**`)
    .setFooter({text: config.m_pub_time_stop_description})
    .setColor(config.embedColor)
/* _________________________________________________________ */

var testToken = {};

module.exports.run = async (client, message, args) => {
            if (!message.member.roles.cache.get(config.wlrole)) return;

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])

    if (settings.exchanging[message.author.id] == true) return message.channel.send({embeds: [embed_pubing]})
    if (!target) return message.channel.send("Vous devez mentionnez la personne avec qui faire l'échange")
    if (target.id === message.author.id) return message.channel.send("Vous ne pouvez pas faire d'échange à vous même")
    if (target.user.bot) return message.channel.send("Vous ne pouvez pas faire d'échange à un bot")

    settings.exchanging[message.author.id] = true;

    const authorFilter = m => m.author.id == message.author.id;
    const targetFilter = m => m.author.id == target.user.id;

    let authorExchange;
    try{
        authorExchange = await message.author.send({embeds: [new Discord.EmbedBuilder().setTitle(`Échange sécurisé avec ${target.user.username}`).setDescription("Veuillez entrer votre token.").setFooter({text: "Vous avez 60 secondes"}).setColor(config.embedColor)]})
        message.channel.send("Vous avez reçu un message privé pour commencez votre échange")
    } catch(err){
        message.channel.send("Vous devez autoriser les messages privé !")
        settings.exchanging[message.author.id] = false;
    }

    authorExchange.channel.awaitMessages({filter: authorFilter, max: 1, time: 60000, errors: ['time'] }).then(async collected => {
        const authorToken = collected.first().content
        if(authorToken === ""){
            message.author.send({embeds: [embed_token_invalid]});
            return settings.exchanging[message.author.id] = false;
        }
                    
        testToken[message.author.id] = new Discord.Client({intents: [Object.keys(Discord.GatewayIntentBits)]});
        testToken[message.author.id].login(authorToken).catch(err => {
            message.author.send({embeds: [embed_token_invalid]})
            settings.exchanging[message.author.id] = false;
        })

        let authorBottag;
        let targetExchange;
        let authorBotmemberCount;
        let authorBotserverCount;
        let targetExchangeAccept;

        testToken[message.author.id].on("ready", async () => {
            authorBottag = testToken[message.author.id].user.tag;
            authorBotmemberCount = testToken[message.author.id].users.cache.size;
            authorBotserverCount = testToken[message.author.id].guilds.cache.size;
            try{
                targetExchangeAccept = await target.send({embeds: [new Discord.EmbedBuilder().setTitle(`Demande d'échange reçu de ${message.author.username}`).setDescription(`Voulez-vous accepter l'échange ?\n\nℹ️ Informations du token du destinataire:`).addFields({ name: "**🤖 Name :**", value: `\`\`\`${testToken[message.author.id].user.username}\`\`\``, inline: true }).addFields({ name: "**🛠️ ID :**", value: `\`\`\`${testToken[message.author.id].user.id}\`\`\``, inline: true }).addFields({ name: "**📈 Servers:**", value: `\`\`\`${testToken[message.author.id].guilds.cache.size}\`\`\``, inline: true }).addFields({ name: "**👤 Users:**", value: `\`\`\`${testToken[message.author.id].users.cache.size}\`\`\``, inline: true }).addFields({ name: "**💭 Channels :**", value: `\`\`\`${testToken[message.author.id].channels.cache.size}\`\`\``, inline: true }).setFooter({text: "Vous avez 60 secondes"}).setColor(config.embedColor)]})                        
                targetExchangeAccept.react("✅")
                targetExchangeAccept.react("❌")
                message.author.send("Demande envoyé, le destinataire a 5 minutes pour répondre.")
            } catch(err){
                console.log(err)
                message.author.send("Le destinataire a bloqué ses messages privé")
                settings.exchanging[message.author.id] = false;
            }

            const ReactfilterTarget = (reaction, user) => { return ['✅', '❌'].includes(reaction.emoji.name) && user.id === target.id };
            const ReactfilterAuthor = (reaction, user) => { return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id };

            targetExchangeAccept?.awaitReactions({filter: ReactfilterTarget, max: 1, time: 300000, errors: ['time'] }).then(async collected => {
                const reaction = collected.first();
                if (reaction.emoji.name === '✅') {
                    message.author.send("Le destinataire a acceptez votre échange")
                    message.author.send("En attente des données")
                    targetExchange = await reaction.message.channel.send({embeds: [new Discord.EmbedBuilder().setTitle(`Échange sécurisé avec ${message.author.tag}`).setDescription("Veuillez entrer votre token.").setFooter({text: "Vous avez 60 secondes"}).setColor(config.embedColor)]})                    
                    targetExchange.channel.awaitMessages({filter: targetFilter, max: 1, time: 60000, errors: ['time'] }).then(async collected => {                    
                        const targetToken = collected.first().content
                        if(targetToken === ""){
                            target.send({embeds: [embed_token_invalid]});
                            return settings.exchanging[message.author.id] = false;
                        }                   
                        testToken[reaction.message.channel.id] = new Discord.Client({intents: [Object.keys(Discord.GatewayIntentBits)]});
                        testToken[reaction.message.channel.id].login(targetToken).catch(err => {
                            reaction.message.channel.send({embeds: [embed_token_invalid]})
                            settings.exchanging[message.author.id] = false;
                        })

                        testToken[reaction.message.channel.id].on("ready", async () => {
                            reaction.message.channel.send("Votre proposition à été envoyée.")
                            
                            let lastStep = await message.author.send({embeds: [new Discord.EmbedBuilder().setTitle(`Proposition reçus de ${target.user.username}`).setDescription(`Voulez-vous accepter l'échange ?\n\nℹ️ Informations du token du destinataire:`).addFields({ name: "**🤖 Name :**", value: `\`\`\`${testToken[reaction.message.channel.id].user.username}\`\`\``, inline: true }).addFields({ name: "**🛠️ ID :**", value: `\`\`\`${testToken[reaction.message.channel.id].user.id}\`\`\``, inline: true }).addFields({ name: "**📈 Servers:**", value: `\`\`\`${testToken[reaction.message.channel.id].guilds.cache.size}\`\`\``, inline: true }).addFields({ name: "**👤 Users:**", value: `\`\`\`${testToken[reaction.message.channel.id].users.cache.size}\`\`\``, inline: true }).addFields({ name: "**💭 Channels :**", value: `\`\`\`${testToken[reaction.message.channel.id].channels.cache.size}\`\`\``, inline: true }).setFooter({text: "Vous avez 60 secondes"}).setColor(config.embedColor)]})
                            lastStep.react("✅")
                            lastStep.react("❌")

                            lastStep.awaitReactions({filter: ReactfilterAuthor, max: 1, time: 300000, errors: ['time'] }).then(async collected => {
                                const reactionn = collected.first();
                                if (reactionn.emoji.name === '✅') {
                                    message.author.send({embeds: [new Discord.EmbedBuilder().setTitle("Échange accepté").setDescription(`Voici le token: ${targetToken}`)]})
                                    reaction.message.channel.send({embeds: [new Discord.EmbedBuilder().setTitle("Échange accepté").setDescription(`Voici le token: ${authorToken}`)]})
                                }
                                else if (reactionn.emoji.name === '❌') {
                                    reaction.message.channel.send("L'utilisateur a refusé votre échange")
                                    settings.exchanging[message.author.id] = false;
                                }
                            }).catch(collected => {
                                message.channel.send({embeds: [embed_pub_time_stop]})
                                settings.exchanging = false;
                            })                        
                        })
                    })
                    .catch(collected => {
                        message.author.send({embeds: [embed_pub_time_stop]})
                        settings.exchanging = false;
                    })
                }
                else if (reaction.emoji.name === '❌') {
                    message.author.send("Le destinataire a refusé votre échange")
                    settings.exchanging[message.author.id] = false;
                }
            })
            .catch(collected => {
                message.author.send({embeds: [embed_pub_time_stop]})
                settings.exchanging = false;
            })
        })
    })
    .catch(collected => {
        message.author.send({embeds: [embed_pub_time_stop]})
        settings.exchanging = false;
    })   
}

module.exports.help = {
    name: "echange",
    description: "Cette commande sert à faire des échanges de token bot entre les membres de façon securiser",
    category: "autres",
    wl: true,
}