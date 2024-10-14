const fs = require("fs");
const MPPClient = require("mpp-client-net").Client;
const client = new MPPClient("wss://mppclone.com", process.env.TOKEN);
const config = require("./config.json");
const shopData = require("./shop.json");
const path = require("path");
const ai = require("./ai.js");
const { Client, Events, GatewayIntentBits } = require("discord.js");
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});
const db = require("smn-db")("db.json");
const war = require("./warnings.js");
globalThis.ranks = require("./ranks.json");
const keyNameMap = require("./key-map.json");
const MidiPlayer = require("./MidiPlayer.js");
//const keep_alive = require('./keep_alive.js');
const { time, info } = require("console");
const bot = require("./bot.js");
const { userInfo } = require("os");
var following = "";
var cursor = { x: 50, y: 50, vel: { x: 1, y: 1 }, anim: "circle" };
const defaultUser = () => {
  return { items: {}, balance: 0 };
};

const player = new MidiPlayer.Player(function (event) {
  if (
    event.name === "Note off" ||
    (event.name === "Note on" && event.velocity === 0)
  ) {
    // Note off or Note on with zero velocity
  } else if (event.name === "Note on") {
    client.startNote(keyNameMap[event.noteName], event.velocity / 127);
  } else if (event.name === "Set Tempo") {
    player.setTempo(event.data);
  }
});

function chat(string) {
  client.sendArray([{ m: "a", message: string }]);
}

let prefix = ".";
let pprefix = ",";
let mprefix = "~";

client.setChannel(config.room);
client.start();
console.log("The bot is online");

client.on("hi", (msg) => {
  if (msg.u.name !== config.name || msg.u.color !== config.color) {
    client.sendArray([
      {
        m: "userset",
        set: {
          name: config.name,
          color: config.color,
        },
      },
    ]);
  }
});

client.say = (message, reply_to) => {
  client.sendArray([
    {
      m: "a",
      message,
      reply_to,
    },
  ]);
};

client.on("a", async (msg) => {
  let args = msg.a.split(" ");
  let cmd = args[0].toLowerCase();
  let input = msg.a.substr(cmd.length + 1).trim();
  let rank = ranks[msg.p._id]?.rank ?? 0;
  let say = msg.discord
    ? msg.discord:
      msg.m === "a"
      ? client.say
      : (m) => client.sendArray([{ m: "dm", _id: msg.p._id, message: m }]);
  if (cmd !== `${prefix}rank` && rank == 8) return;
  if (cmd === `${prefix}help`) {
    if (rank === 8) {
      say(
        "If you have been banned, you must first say sorry, but if you have been banned often, you can no longer be chatted with the bot.",
      );
    } else {
      var commandcats = {
        nice: ["report"],
        normal: ["help", "fun", "economy", "info"],
        midi: ["play", "stop"],
        anim: ["anim", "follow", "unfollow"],
        mod: ["banlist"],
        admin: ["unban", "kick"],
        owner: ["kbcmds", "setcmds", "options"],
      };

      if (!commandcats[input])
        return say(
          `${input.length == 0 ? "" : "Category not found. | "}Usage: ${prefix}help <category> | Category: ${Object.keys(commandcats).join(", ")}`,
        );
      return say(`${input} commands: ${commandcats[input].join(", ")}`);
      /*
        [
          `Normal commands: | help, | fun, | economy, | info,`,
          `Midis commands: | play, | stop,`,
          `Anim commands: | anim, | follow, | unfollow,`,
          `Admin commands: | unban, | kick,`,
          `Owner commands: | kbcmds, | setcmds, | options,`,
        ].forEach(say);
        */
    }
  }

  if (cmd === `${pprefix}help`) {
    say("Coming soon");
  }
  if (cmd === `${mprefix}help`) {
    say("sorry this is not mpp.8448.space. Join https://mpp.8448,space/");
  }

  if (cmd === `${prefix}info`) {
    say(`Info commands: ${prefix}info, | ${prefix}info_bot,`);
  }

  if (cmd === `${prefix}info_bot`) {
    say(
      `Bot info: | name: ${config.name}, | prefix: ${prefix} | color: ${config.color}, | room: ${config.room} | version: ${config.version} | ping: Error`,
    );
  }

  if (cmd === `${prefix}about`) {
    say(
      `This bot made by: | @_Builderman_ | version: ${config.version} | Discord is: https://discord.gg/MKUP2FMtuX | Email: Builderman@musician.org | This bot is made in: 2024`,
    );
  }

  if (cmd === `${prefix}fun`) {
    say(
      `Fun commands: ${prefix}say, ${prefix}who, ${prefix}translate, ${prefix}time,`,
    );
  }

  if (cmd === `${prefix}economy`) {
    say(
      `Economy commands: ${prefix}invertory, ${prefix}balance, ${prefix}shop, ${prefix}buy, ${prefix}sell, ${prefix}pay, ${prefix}rank, ${prefix}work, ${prefix}firework,`,
    );
  }
  if (cmd === `${prefix}balance`) {
    try {
      var bal = db.data[msg.p._id]?.balance ?? 0;
      var itemsObj = db.data[msg.p._id]?.items;
      var items = itemsObj
        ? Object.entries(itemsObj)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "No items";
      say(`Your balance is **$${bal}**`);
    } catch (error) {
      console.log("Error occurred in balance command:", error);
      say(
        "There was an error processing your balance. Please try again later.",
      );
    }
  }

  function getCurrentTimeInTimeZone(timeZone, locale = "en-US") {
    return new Date().toLocaleString(locale, {
      timeZone: timeZone,
      timeZoneName: "long",
    });
  }

  if (cmd === `${prefix}time_kor`) {
    const timeZone = "Asia/Seoul";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-KR");
    say(`The time in Korea is: ${currentTime}`);
  }

  if (cmd === `${prefix}time_fr`) {
    const timeZone = "Europe/Paris";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-FR");
    say(`The time in Europe (Paris) is: ${currentTime}`);
  }

  if (cmd === `${prefix}time_usa`) {
    const timeZone = "America/New_York";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-US");
    say(`The time in the USA (New York) is: ${currentTime}`);
  }

  if (cmd === `${prefix}time_aus`) {
    const timeZone = "Australia/Sydney";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-AU");
    say(`The time in Australia (Sydney) is: ${currentTime}`);
  }

  if (cmd === `${prefix}time_nl`) {
    const timeZone = "Europe/Amsterdam";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-NL");
    say(`The time in the Netherlands is: ${currentTime}`);
  }

  if (cmd === `${prefix}time_ist`) {
    const timeZone = "Asia/Kolkata";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-IN");
    say(`The time in India (IST) is: ${currentTime}`);
  }

  if (cmd === `${prefix}time_gr`) {
    const timeZone = "Europe/Athens";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-GR");
    say(`The time in Greece is: ${currentTime}`);
  }

  if (cmd === `${prefix}time_ja`) {
    const timeZone = "Asia/Tokyo";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-JP");
    say(`The time in Japan is: ${currentTime}`);
  }
  if (cmd === `${prefix}time_tr`) {
    const timeZone = "Europe/Istanbul";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-TR");
    say(`The time in Turkey is: ${currentTime}`);
  }
  if (cmd === `${prefix}time_ru`) {
    const timeZone = "Europe/Moscow";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-RU");
    say(`The time in Russia is: ${currentTime}`);
  }
  if (cmd === `${prefix}time_en`) {
    const timeZone = "America/New_York";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-US");
    say(`The time in the USA (New York) is: ${currentTime}`);
  }
  if (cmd === `${prefix}time_pa`) {
    const timeZone = "Asia/Karachi";
    const currentTime = getCurrentTimeInTimeZone(timeZone, "en-PK");
    say(`The time in Pakistan is: ${currentTime}`);
  }
  if (cmd === `${prefix}time`) {
    say(
      `Korean: ${prefix}time_kor, | French: ${prefix}time_fr, | USA: ${prefix}time_usa, | Australia: ${prefix}time_aus, | India: ${prefix}time_ist, | Netherlands: ${prefix}time_nl, | georgian: ${prefix}time_gr, | Pakistan: ${prefix}time_pa, | Japan: ${prefix}time_ja, | Russia: ${prefix}time_ru, | Turkey: ${prefix}time_tr, | enlish: ${prefix}time_en,`,
    );
  }
  if (cmd === `${prefix}translate`) {
    if (args.length == 1)
      return say(`Usage: ${prefix}translate <language> <text>`);
    var response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(args[1])}&dt=t&dj=1&source=input&text=${encodeURIComponent(args.slice(2).join(" "))}`,
    ).then((a) => a.json());
    say("Translation: " + response.sentences[0].trans);
  }
  if (cmd === `${prefix}trans`) {
    if (args.length == 1)
      return say(`Usage: ${prefix}translate <language> <text>`);
    var response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(args[1])}&dt=t&dj=1&source=input&text=${encodeURIComponent(args.slice(2).join(" "))}`,
    ).then((a) => a.json());
    say("Translation: " + response.sentences[0].trans);
  }
  if (cmd === `${prefix}who`) {
    var part = client.ppl[input] ? client.ppl[input] : msg.p;
    say(
      `Id: ${part._id} | Name: ${part.name} | Color: ${part.color} | Rank: ${ranks[part._id]?.rank ?? 0}`,
    );
  }
  if (cmd === `${prefix}work`) {
    say("You started working.");
    setTimeout(
      async () => {
        try {
          var user = db.data[msg.p._id] || defaultUser();
          var balance = user.balance || 0;
          var amount = Math.floor(Math.random() * 1000);
          user.balance = balance + amount;
          db.data[msg.p._id] = user;
          say(
            `You finished working and made **$${amount}** | Workspeed: ${db.data[msg.p._id].speed ? db.data[msg.p._id].speed : 1}x | `,
          );
          db.write();
        } catch (error) {
          console.log("Error occurred in work command:", error);
          say("There was an error processing your work.");
        }
      },
      Math.floor(Math.random() * 6000) + 6000,
    );
  }
  if (cmd === `${prefix}pay`) {
    if (args.length < 3 || isNaN(Number(args[2])))
      return say(`Usage: ${prefix}give (user_id) (amount)`);
    const userId = args[1];
    const amount = Number(args[2]);
    if (amount <= 0) {
      say("Amount must be greater than 0.");
      return;
    }
    const user = db.data[msg.p._id] || defaultUser();
    if (user.balance < amount) {
      say("You don't have enough money to give.");
      return;
    }
    const receiver = db.data[userId] || defaultUser();
    user.balance -= amount;
    receiver.balance += amount;
    db.data[msg.p._id] = user;
    db.data[userId] = receiver;
    say(`You gave $${amount} to ${userId}`);
  }
  if (cmd === `${prefix}sell`) {
    if (args.length == 1) return say(`Usage: ${prefix}sell <item_id>`);
    var item = shopData.find((item) => item.id === args[1]);
    if (!item) return say("Item not found.");
    var user = db.data[msg.p._id] || defaultUser();
    if (!user.items[item.id]) return say(`You don't own any ${item.name}.`);
    user.items[item.id]--;
    if (user.items[item.id] === 0) {
      delete user.items[item.id];
    }
    user.balance += Math.floor(item.cost / 2);
    db.data[msg.p._id] = user;
    say(`You sold ${item.name} for $${Math.floor(item.cost / 2)}.`);
  }
  if (cmd === `${prefix}follow`) {
    if (!args[1] || !client.ppl[args[1]])
      return say(`Usage: ${prefix}follow <ID>`);
    following = args[1];
    say("following");
  }
  if (cmd === `${prefix}unfollow`) {
    following = "";
    say("Stopped following");
  }
  // Command Handler
  // Command Handler
  if (cmd === `${prefix}buy`) {
    handleBuyCommand(args);
  } else if (cmd === `${prefix}shop`) {
    displayShop();
  }

  // Function to handle the buy command
  function handleBuyCommand(args) {
    if (args.length !== 2) {
      return say(`Usage: ${prefix}buy <item_id> | ${prefix}shop`);
    }

    const itemId = args[1];
    const item = shopData.find((item) => item.id === itemId);

    if (!item) {
      return say("Item not found.");
    }

    const userId = msg.p._id;
    const user = db.data[userId] || defaultUser();

    // Ensure user's balance and items are initialized
    user.balance = user.balance || 0;
    user.items = user.items || {};

    if (user.balance < item.cost) {
      return say("You don't have enough money to buy this item.");
    }

    // Deduct the cost and update the user's items
    user.balance -= item.cost;
    user.items[itemId] = (user.items[itemId] || 0) + 1;

    // Save the updated user data
    db.data[userId] = user;

    return say(`You bought ${item.name} for $${item.cost}.`);
  }

  // Function to display the shop
  function displayShop() {
    const shopMessage = shopData
      .map((item) => `${item.name} - $${item.cost}`)
      .join(", ");
    return say(`Shop: ${shopMessage}`);
  }

  // Example of defaultUser function (update if necessary)
  function defaultUser() {
    return {
      balance: 0,
      items: {},
    };
  }
  if (rank >= 5 && cmd === `${prefix}rank-admin`) {
    say(`Admins: ${Object.keys(rank).filter((a) => ranks[a].rank >= 3)}`);
  }
  if (rank >= 5 && cmd === `${prefix}rank-owner`) {
    say(`Owners: ${Object.keys(rank).filter((a) => ranks[a].rank >= 5)}`);
  }
  if (rank >= 1 && cmd === `${prefix}report`) {
    if (args.length < 3) {
      // Ensure there are at least 3 arguments (command, user_id, and reason)
      say(`Usage: ${prefix}report <user_id> <reason>`);
      return;
    }

    const userId = args[1];
    const reason = args.slice(2).join(" ");

    if (!client.ppl[userId]) {
      // Check if the user exists in the client.ppl object
      say("User not found.");
      return;
    }

    const reportMessage = `User ID: ${userId}\nReason: ${reason}\nTimestamp: ${new Date().toISOString()}\n\n`;

    // Define the path to the reports file
    const reportsFilePath = path.join(__dirname, "reports.txt");

    // Append the report to the file
    fs.appendFile(reportsFilePath, reportMessage, (err) => {
      if (err) {
        say("Failed to write the report.");
        console.error(err); // Log the error for debugging
        return;
      }

      say("Report has been logged.");
    });
  } else if (rank === 0 && cmd === `${prefix}report`) {
    say(
      "You don't have permission to use this command. You need a higher rank.",
    );
    return;
  }
  if (cmd === `${prefix}rank`) {
    const rankNames = {
      0: "User",
      1: "Vote",
      2: "Meow",
      3: "Trial mod",
      4: "Mod",
      5: "Admin",
      6: "Head admin",
      7: "Owner",
      8: "Banned",
    };
    say(`Your rank is: ${rankNames[rank]}`);
  }
  if (rank >= 1 && cmd === `${prefix}stop`) {
    if (player.isPlaying()) {
      return say("MIDI is currently playing!");
    }
    if (!input) {
      return say("Usage: .play [MIDI file].");
    }
    const inputLowerCase = input.toLowerCase();
    const filesInDirectory = fs.readdirSync("./midi/");
    const matchingFiles = filesInDirectory.filter((file) =>
      file.toLowerCase().startsWith(inputLowerCase),
    );

    if (matchingFiles.length === 0) {
      return say(`No MIDIs are found for ${input}.`);
    } else if (matchingFiles.length > 1) {
      return say(`Many MIDIs found for ${input}. Please be more specific.`);
    }
    let fileName = matchingFiles[0];
    fileName = fileName.endsWith(".mid") ? fileName : fileName + ".mid";

    player.loadFile(`./midi/${fileName}`);
    player.play();
    say(`Playing MIDI ${fileName}`);
  }
  lastMessageTime = Date.now();
  if (rank >= 5 && cmd === `${prefix}stop`) {
    player.stop();
    say("Stopped playing");
  }
  if (rank >= 5 && cmd === `${prefix}js`) {
    try {
      say(`✅ ${eval(input)}`);
    } catch (error) {
      say(`❌ ${error}`);
    }
  }
  if (rank >= 5 && cmd === `${prefix}reload`) {
    if (input === "commands") {
      say("Reloading commands...");
      try {
        delete require.cache[require.resolve("./commands.js")];
        require("./commands.js");
      } catch (error) {
        say(`Error reloading commands: ${error}`);
      }
    } else if (input === "cursor") {
      say("Reloading cursor...");
      try {
        delete require.cache[require.resolve("./cursor.js")];
        require("./cursor.js");
      } catch (error) {
        say(`Error reloading cursor: ${error}`);
      }
    } else if (input === "player") {
      say("Reloading MIDI player...");
      player.stop();
      try {
        delete require.cache[require.resolve("./MidiPlayer.js")];
        require("./MidiPlayer.js");
      } catch (error) {
        say(`Error reloading MIDI player: ${error}`);
      }
    } else {
      say("Options: `commands`, `cursor`, `player`");
    }
    if (input === "commands" || input === "cursor" || input === "player") {
      say("Bot will leave and rejoin to apply changes.");
      client.stop();
      setTimeout(() => {
        client.setChannel(config.room);
        client.start();
        say("reloaded successfully.");
      }, 3000); // 3 sec
    }
  }
  if (rank >= 2 && cmd === `${prefix}banlist`) {
    if (args.length === 1) {
      say(
        `Banned users: ${Object.keys(db.data)
          .filter((id) => db.data[id].rank === 6)
          .join(", ")}`,
      );
    } else if (args.length === 2) {
      const userId = args[1];
      if (db.data[userId] && db.data[userId].rank === 6) {
        say(`User ${userId} is banned.`);
      } else {
        say(`User ${userId} is not banned.`);
      }
    }
  }
  if (cmd === `${prefix}firework`) {
    if (
      db.data[msg.p._id]?.fireworkCooldown &&
      Date.now() < db.data[msg.p._id]?.fireworkCooldown
    ) {
      say(
        "Sorry you have already used this command you have to wait 2 minutes.",
      );
    } else {
      say("3");
      setTimeout(() => {
        say("2");
        setTimeout(() => {
          say("1");
          setTimeout(() => {
            try {
              var bal = db.data[msg.p._id]?.balance ?? 0;
              bal += 1000;
              db.data[msg.p._id] = {
                ...db.data[msg.p._id],
                balance: bal,
                fireworkCooldown: Date.now() + 120000,
              }; // 2 minutes cooldown
              db.write();
              say(`You got 1000$ for using the firework command.`);
            } catch (error) {
              console.log("Error occurred in firework command:", error);
              say(
                "There was an error processing your firework. Please try again later.",
              );
            }
          }, 1000);
        }, 1000);
      }, 1000);
    }
  }
  if (rank >= 7 && cmd === `${prefix}restart`) {
    say("Restarting...");
    client.stop();
    setTimeout(() => {
      client.start();
      say("Restarted successfully.");
    }, 3000);
  }
  if (rank >= 7 && cmd === `${prefix}setroom`) {
    if (args.length === 1) {
      say(`Usage: ${prefix}setroom <room_name>`);
    } else {
      const roomName = args.slice(1).join(" ");
      config.room = roomName;
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
      say(`Room set to ${roomName}`);
      client.pr();
      setTimeout(() => {
        client.start();
      }, 2000); // 2 second delay
    }
  }
  if (rank >= 7 && cmd === `${prefix}setbalance`) {
    if (args.length < 3) {
      // Check if there are fewer than 3 arguments
      say(`Usage: ${prefix}setbalance <user_id> <amount>`);
    } else {
      const userId = args[1];
      const amount = Number(args[2]);
      if (isNaN(amount)) {
        say("Invalid amount.");
      } else {
        const user = db.data[userId] || defaultUser();
        user.balance = amount;
        db.data[userId] = user;
        say(`Balance set to ${amount} for user ${userId}.`);
      }
    }
  }
  if (rank >= 7 && cmd === `${prefix}ranklist`) {
    say(
      "Owner: 7 | Head admin: 6 | Admin: 5 | Mod: 4 | Trial mod: 3 | Meow: 2 | Vote: 1 | User: 0 | Banned: -1",
    );
  }
  if (rank >= 5 && cmd === `${prefix}setprefix`) {
    if (args.length === 1) {
      say(`Usage: ${prefix}setprefix <new prefix>`);
    } else {
      prefix = args[1];
      say(`Prefix set to ${prefix}`);
    }
  }
  if (rank >= 7 && cmd === `${prefix}clear`) {
    if (args.length === 1) {
      say(`Usage: ${prefix}clear <amount>`);
    } else if (args.length === 2) {
      const amount = Number(args[1]);
      if (isNaN(amount)) {
        say("Invalid amount.");
      } else {
        say(`Cleared ${amount} messages.`);
        sendArray([
          { m: "chat", _id: msg.p._id, message: `Cleared ${amount} messages.` },
        ]);
        sendArray([{ m: "delete", _id: msg.p._id, count: amount }]);
      }
    }
  }
  if (rank >= 7 && cmd === `${prefix}shutdown`) {
    say("Shutting down...");
    setTimeout(() => {
      process.exit();
    }, 1000);
  }
  if (rank >= 7 && cmd === `${prefix}options`) {
    say(
      `Options: ${Object.keys(config)
        .filter((key) => key !== "room")
        .join(", ")}`,
    );
  }
  if (rank >= 7 && cmd === `${prefix}setrank`) {
    if (args.length == 1)
      return say(`Usage: ${prefix}setrank <user_id> <rank>`);
    if (!ranks[args[1]]) ranks[args[1]] = {};
    ranks[args[1]] = { rank: Number(args[2]) };
    require("fs").writeFileSync("ranks.json", JSON.stringify(ranks));
    say(`Done`);
  }
  if (rank >= 7 && cmd === `${prefix}kick`) {
    client.sendArray([
      { m: "kickban", _id: input, ms: 0 },
    ]);
    say(`Id ${player.id.banned} has been removed. reason: ${reason}.`);
  }
  if (rank >= 7 && cmd === `${prefix}ban`) {
    client.sendArray([
      { m: "kickban", _id: input, ms: 100, reason: "Banned by bot" },
    ]);
    say(`Id ${player.id.banned} has been banned. reason: ${reason}.`);
  }
  if (rank >= 7 && cmd === `${prefix}menu`) {
    say(`menu commands: | options, | clear,`);
  }
  if (rank >= 7 && cmd === `${prefix}kbcmds`) {
    say(`Kick banned commands: | banlist, | ban, | unban, | kick,`);
  }
  if (rank >= 7 && cmd === `${prefix}setcmds`) {
    say(
      `setcommands: | setrank, | setbalance, | setitems, | setcmds, | setname, | setcolor, | setroom, | setprefix,`,
    );
  }
  if (rank >= 7 && cmd === `${prefix}leave`) {
    say(`Bot disconnected.`);
    client.stop();
  }
  if (rank >= 7 && cmd === `${prefix}crown`) {
    client.sendArray([{ m: "chown", id: msg.p.id }]);
    say(
      client.isOwner() ? `${msg.p.name} Got a crown.` : `I dont have a crown.`,
    );
  }
  console.log(`[${msg.p._id}] ${msg.p.name}: ${msg.a}`);
});
  client.sendArray([
  {
      m: "+custom",
  }])
  client.on("custom", ((e) => {

  if ("summon" == e.data.event && "65cc3012e78cd44b5bd2bfd5" == e.p) {
        client.setChannel(decodeURIComponent(e.data.room));
  }

}))


setInterval(() => {
  if (client.ppl[following]) {
    cursor.x = client.ppl[following].x;
    cursor.y = client.ppl[following].y;
  } else {
    if (cursor.anim === "circle") {
      var time = Date.now() / 1000;
      cursor.x = 50 + Math.sin(time) * 15;
      cursor.y = 50 + Math.cos(time) * 7.5;
    } else if (cursor.anim === "dvd") {
      cursor.x += cursor.vel.x;
      //cursor.y += cursor.vel.y;
      cursor.y += cursor.vel.y == -1 ? -0.53 : 0.51;
      if (cursor.x < 0 || cursor.x > 100) {
        cursor.vel.x *= -1;
      }
      if (cursor.y < 0 || cursor.y > 100) {
        cursor.vel.y *= -1;
      }
    }
  }
  client.sendArray([{ m: "m", x: cursor.x, y: cursor.y }]);
}, 66);
setInterval(function () {
  if (client.noteQuota) {
    client.noteQuota.points = 100000000000;
  }
}, 1);

const rl = new (require("readline").Interface)({
  input: process.stdin,
  output: process.stdout,
  prompt: "",
});
rl.on("line", client.say);
client.on("dm", (msg) =>
  client.emit("a", { m: "dm", a: msg.a, p: msg.sender, t: msg.t }),
);
discord.once("ready", () => console.log(`Connected to discord!`));
discord.on("messageCreate", async (msg) => {
  //console.log(msg);
  if (msg.author.bot || msg.channel.id !== "1188877027902750828") return;
  client.emit("a", {
    m: msg.channel.isDMBased() ? "dm" : "a",
    a: msg.content,
    p: {
      _id: `D-${msg.author.id}`,
      id: `D-${msg.author.id}`,
      color: msg.member.displayHexColor,
      name: msg.author.tag,
    },
    t: Date.now(),
    discord: (m) => msg.reply(m).catch(() => {}),
  });
});
//discord.on('messageCreate', console.log)
//discord.login(process.env.DISCORD);
