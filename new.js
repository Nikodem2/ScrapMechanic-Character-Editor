import { createRequire } from "module";
import chalk from "chalk";
import fs from "fs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const require = createRequire(import.meta.url);
const names = require("./CustomizationDescriptions.json");
const config = require("./config.json");
const path = process.env.APPDATA + "/Axolot Games/Scrap Mechanic/User/User_" + config.steamId64 + "/character";

let slots = [];
let slotnames = [
  "Head / Face",
  "Hair",
  "Beard",
  "Torso",
  "Gloves",
  "Shoes",
  "Pants",
  "Hat",
  "Backpack",
];
let gender = 0;

function editColor(slot) {
  rl.question("Would you like to edit the colour: ", (answer) => {
    if (answer.toLocaleLowerCase() == "no") return selectSlot();
    rl.question("Change it to (colorindex 1-255): ", (answer2) => {
      let color = answer2;
      if (color < -1 || color > 256 || isNaN(+color)) {
        console.log(chalk.redBright("Invalid Color"));
        editColor(slot);
        return;
      }
      slots[slot].color = color;
      console.log(chalk.greenBright("Changed Color"));
      selectSlot();
    });
  });
}

function editSlot(slot) {
  rl.question("Change it to: ", (answer2) => {
    let uuid
    if (answer2.toLocaleLowerCase() == "nothing") {
      uuid = "00000000-0000-0000-0000-000000000000";
    } else {
      uuid = Object.keys(names).find(id =>names[id].title.toLocaleLowerCase() == answer2.toLocaleLowerCase());
    }
    if (!uuid) {
      console.log(chalk.redBright("Invalid Garment"));
      editSlot(slot);
      return;
    }
    var oldUuid = slots[slot].id;
    slots[slot].id = uuid;
		if (names[uuid] && names[oldUuid]) console.log(chalk.greenBright("Changed " + names[oldUuid].title + " to " + names[uuid].title));
		else if (!names[uuid]) console.log(chalk.greenBright("Changed " + names[oldUuid].title + " to nothing"));
    else if (!names[oldUuid]) console.log(chalk.greenBright("Changed nothing to " + names[uuid].title));
    else console.log(chalk.greenBright("Changed nothing to nothing"));
    editColor(slot);
  });
}

function selectSlot() {
  console.log(chalk.greenBright("Select a slot to edit"));
  for (let i = 0; i < slots.length; i++) {
    if (names[slots[i].id]) console.log(chalk.greenBright(i + 1 + ". " + (slotnames[i] || "Extra") +" - " + (names[slots[i].id].title || "Nothing")));
    else console.log(chalk.greenBright(i + 1 + ". " + (slotnames[i] || "Extra") + " - Nothing"));
  }
  rl.question("Which slot to edit? (type -1 to exit) \n", (answer) => {
    if (answer == -1) {
      saveFile();
      return;
    }
    if (answer > slots.length) {
      console.log(chalk.redBright("New Slot"));
      slots.push({
        id: "00000000-0000-0000-0000-000000000000",
        color: 0,
      });
    }
    if (answer > slots.length + 1) {
      console.log(chalk.redBright("Invalid Slot"));
      selectSlot();
      return;
    }
    editSlot(answer - 1);
  });
}

function saveFile() {
  let bytes = [];
  for (let i = 0; i < 6 + slots.length * 16 + slots.length * 4; i++) {
    bytes.push(0x00);
  }
  let data = new Buffer.from(bytes);
  for (let b = 0; b < 6; b++) {
    let byte = 0;
    if (b == 3) byte = 2;
    if (b == 4) byte = gender;
    if (b == 5) byte = slots.length;
    data[b] = byte;
  }
  for (let i = 0; i < slots.length; i++) {
    let slot = slots[i];
    let offset = 6 + i * 16;
    let coloroffset = 6 + slots.length * 16 + i * 4;
    let uuidBytes = slot.id.replaceAll("-", "").match(/.{1,2}/g);
    for (var b = 0; b < 16; b++) {
      data[offset + b] = parseInt(uuidBytes[b], 16);
    }
    data[coloroffset + 3] = slot.color;
  }
  fs.writeFile(path, data, (err) => {
    if (err) throw err;
    console.log(chalk.greenBright("Saved File"));
    setTimeout(() => {
      process.exit();
    }, 1000);
  });
}

function readFile() {
  fs.readFile(path, (err, data) => {
    if (err) throw err;
    gender = data[4];
    let slotcount = data[5];
    for (let i = 0; i < slotcount; i++) {
      let offset = 6 + i * 16;
      let coloroffset = 6 + slotcount * 16 + i * 4;
      let uuid = "";
      for (let b = 0; b < 16; b++) {
        let hex = data[offset + b].toString(16);
        if (hex.length == 1) uuid += "0";
        uuid += hex;
        if (b == 3 || b == 5 || b == 7 || b == 9) {
          uuid += "-";
        }
      }
      let color = data[coloroffset + 3];
      slots.push({
        id: uuid,
        color: color,
      });
    }
    console.log(chalk.redBright("Loaded File"));
    console.log(chalk.greenBright(slots.length + " Slots Loaded"));
    selectSlot();
  });
}

readFile();
