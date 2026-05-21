#!/usr/bin/env node
import { Client } from 'ssh2'
import fs from 'fs'
import os from 'os'

const args = process.argv.slice(2)
const config = { host: '', port: 22, user: '', password: '', keyPath: '', busType: 'session' }

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--host': config.host = args[++i]; break
    case '--port': config.port = parseInt(args[++i], 10); break
    case '--user': config.user = args[++i]; break
    case '--password': config.password = args[++i]; break
    case '--key': config.keyPath = args[++i]; break
    case '--bus': config.busType = args[++i]; break
    case '--help':
      console.log('Usage: node test-remote.mjs --host <ip> --user <user> --password <pass>')
      process.exit(0)
  }
}

if (!config.host || !config.user) { console.error('Error: --host and --user required'); process.exit(1) }

const log = (m) => console.log(`[INFO] ${m}`)
const ok = (m) => console.log(`[OK] ${m}`)

function runCmd(client, cmd) {
  return new Promise((resolve, reject) => {
    client.exec(cmd, (err, stream) => {
      if (err) { reject(err); return }
      let out = '', stderr = ''
      stream.on('data', d => out += d.toString())
      stream.stderr.on('data', d => stderr += d.toString())
      stream.on('close', () => stderr && !out ? reject(new Error(stderr.trim())) : resolve(out.trim()))
    })
  })
}

async function main() {
  log(`Connecting to ${config.user}@${config.host}:${config.port}...`)
  const client = new Client()

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('SSH timeout')), 15000)
    client.on('ready', () => { clearTimeout(t); ok('SSH connected'); resolve() })
    client.on('error', e => { clearTimeout(t); reject(e) })
    const cfg = { host: config.host, port: config.port, username: config.user, readyTimeout: 15000 }
    if (config.password) cfg.password = config.password
    else { const kp = config.keyPath.replace('~', os.homedir()); try { cfg.privateKey = fs.readFileSync(kp) } catch { reject(new Error(`Key not found: ${kp}`)); return } }
    client.connect(cfg)
  })

  // Check gdbus
  log('Checking gdbus...')
  const gdbusPath = await runCmd(client, 'which gdbus')
  if (!gdbusPath) { console.error('[ERROR] gdbus not found'); process.exit(1) }
  ok(`gdbus: ${gdbusPath}`)

  // List services
  const busFlag = config.busType === 'system' ? '--system' : '--session'
  log('Listing D-Bus services...')
  const output = await runCmd(client, `gdbus call ${busFlag} --dest org.freedesktop.DBus --object-path /org/freedesktop/DBus --method org.freedesktop.DBus.ListNames`)

  const match = output.match(/\[(.*)\]/s)
  if (!match) { console.error('[ERROR] Failed to parse service list'); process.exit(1) }

  const services = match[1].split(',').map(s => s.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '')).filter(n => n && !n.startsWith(':')).sort()

  ok(`Found ${services.length} services:`)
  console.log('')
  services.forEach(s => console.log(`  ${s}`))
  console.log('')
  ok('Remote D-Bus test PASSED!')
  client.end()
}

main().catch(e => { console.error(`[ERROR] ${e.message}`); process.exit(1) })
