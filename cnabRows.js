'use strict';
import path from 'path'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url';

import yargs from 'yargs'
import chalk from 'chalk'

const optionsYargs = yargs(process.argv.slice(2))
  .usage('Uso: $0 [options]')
  .option("f", { alias: "from", describe: "posição inicial de pesquisa da linha do Cnab", type: "number", demandOption: true })
  .option("t", { alias: "to", describe: "posição final de pesquisa da linha do Cnab", type: "number", demandOption: true })
  .option("s", { alias: "segmento", describe: "tipo de segmento", type: "string", demandOption: true })
  .option("c", { alias: "cnab", describe: "caminho do arquivo CNAB", type: "string" } )
  .option("e", { alias: "empresa", describe: "Nome da empresa", type: "string", demandOption: true })
  .example('$0 -f 21 -t 34 -s p', 'lista a linha e campo que from e to do cnab')
  .argv;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cnab;

cnab = optionsYargs.cnab || path.join(__dirname, 'cnabExample.rem');

const file = path.resolve(cnab)

const { from, to, segmento, empresa } = optionsYargs

const sliceArrayPosition = (arr, ...positions) => [...arr].slice(...positions)

const messageLog = (segmento, segmentoType, from, to) => `
----- Cnab linha ${segmentoType} -----

posição from: ${chalk.inverse.bgBlack(from)}

posição to: ${chalk.inverse.bgBlack(to)}

item isolado: ${chalk.inverse.bgBlack(segmento.substring(from - 1, to))}

item dentro da linha P: 
  ${segmento.substring(0, from)}${chalk.inverse.bgBlack(segmento.substring(from - 1, to))}${segmento.substring(to)}

----- FIM ------
`

const log = console.log

console.time('leitura Async')

readFile(file, 'utf8')
  .then(file => {
    const cnabArray = file.split('\n')

    const cnabHeader = sliceArrayPosition(cnabArray, 0, 2)

    const [cnabBodySegmentoP, cnabBodySegmentoQ, cnabBodySegmentoR] = sliceArrayPosition(cnabArray, 2, -2)

    const cnabTail = sliceArrayPosition(cnabArray, -2)

    if (segmento === 'p') {
      filterByName(cnabBodySegmentoP, 'P', from, to);
      return
    }

    if (segmento === 'q') {
      filterByName(cnabBodySegmentoQ, 'Q', from, to);
      return
    }

    if (segmento === 'r') {
      filterByName(cnabBodySegmentoR, 'R', from, to);
      return
    }

    const result = {
      header: cnabHeader,
      body: {
        P: cnabBodySegmentoP,
        Q: cnabBodySegmentoQ,
        R: cnabBodySegmentoR,
      },
      tail: cnabTail,
    };


    const jsonResult = JSON.stringify(result, null, 2);
    return writeFile('output.json', jsonResult, 'utf8');

  })
  .catch(error => {
    console.log("🚀 ~ file: cnabRows.js ~ line 76 ~ error", error)
  })

  function filterByName(segmento, segmentoType, from, to) {
    if (!empresa) {
      log(messageLog(segmento, segmentoType, from, to));
    } else {
      const filteredLines = segmento.split('\n').filter(line => line.includes(empresa));
      if (filteredLines.length > 0) {
        log(messageLog(filteredLines.join('\n'), segmentoType, from, to));
      } else {
        console.log(`Nenhuma linha correspondente para a empresa "${empresa}" no segmento ${segmentoType}`);
      }
    }
  }

console.timeEnd('leitura Async')
