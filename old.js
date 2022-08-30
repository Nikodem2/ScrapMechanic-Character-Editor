import { createRequire } from "module";
import chalk from "chalk";
import fs from "fs";
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const require = createRequire(import.meta.url);
const names = require('./CustomizationDescriptions.json')
const config = require('./config.json')
const path = process.env.APPDATA + "/Axolot Games/Scrap Mechanic/User/User_" + config.steamId64 + "/character"

var uuids = []

function saveFile() {
  fs.readFile( path, (err, data) => {
    try {
      for (var x = 0; x < data[5]; x++) {
        var uuid = uuids[x].replaceAll('-', '').match(/.{1,2}/g);
          for (var i = 0; i < 16; i++) {
            data[(6 + (16 * x)) + i] = parseInt(uuid[i],16)
          }
      }
    } finally {
      fs.writeFile(path,data, ()=>{
        console.log(chalk.green("Done!"))
        editAsk('What else to edit? (type -1 to exit) \n')
        var index = 0
        uuids.forEach(uuid => {
          index = index + 1
          if (names[uuid]) {
            console.log(chalk.greenBright(index + '. ' + names[uuid].title))
          } else {
            console.log(chalk.greenBright(index + ". Nothing"))
          }
      })
      })
    }
  }
);
}

function edit(answer) {
  rl.question('Change it to: ', (answer2) => {
    var uuid = ""
    if (answer2.toLocaleLowerCase() == 'nothing') {
      uuid = "00000000-0000-0000-0000-000000000000"
    } else {
       uuid = Object.keys(names).find(uuid => names[uuid].title.toLocaleLowerCase() == answer2.toLocaleLowerCase())
    }
    if (!uuid) {
      console.log(chalk.redBright("Invalid Garment"))
      edit(answer)
      return
    }
    var oldUuid = uuids[answer-1]
    uuids[answer-1] = uuid
    saveFile()
  })
}

function editAsk(q) {
  rl.question(q, (answer) => {
    if (answer == -1) { process.exit() }
    if (answer > uuids.length) { console.log("Invalid Item"); editAsk(q); return }
    if (answer < -1 ) { console.log("Invalid Item"); editAsk(q); return }
    if (answer == 0) { console.log("Invalid Item"); editAsk(q); return }
    if (isNaN(answer)) { console.log("Invalid Item"); editAsk(q); return }

    console.log(chalk.blueBright(`Editing ${answer}!`))
    edit(answer)
  })
}

fs.readFile( path, (err, data) => {
    for (var x = 0; x < data[5]; x++) {
      var uuid = "";
      try {
        for (var i = 0; i < 16; i++) {
          if (data[(6 + (16 * x)) + i].toString(16).length == 1) {
            uuid = uuid + "0" + data[(6 + (16 * x)) + i].toString(16);
          } else {
            uuid = uuid + data[(6 + (16 * x)) + i].toString(16);
          }
          if (i == 3 || i == 5 || i == 7 || i == 9) {
            uuid = uuid + "-";
          }
        }
      } finally {
        uuids.push(uuid)
      }
    }
    console.log(chalk.redBright(`Found ${uuids.length} Garments!`))
    editAsk('What to edit? \n')
    var index = 0
    uuids.forEach(uuid => {
        index = index + 1
        if (names[uuid]) {
          console.log(chalk.greenBright(index + '. ' + names[uuid].title))
        } else {
          console.log(chalk.greenBright(index + ". Nothing"))
        }
    })
  }
);
