import puppeteer from 'puppeteer-core'
import { pathToFileURL } from 'node:url'
const html = 'C:/Users/haris/OneDrive/Documents/Projecto F1 Play 2026/Code Project F1 Play 2026/docs/guia/guia-telemetria.html'
const out = 'C:/Users/haris/OneDrive/Documents/Projecto F1 Play 2026/Code Project F1 Play 2026/public/guia/guia-telemetria.pdf'
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle0' })
await page.waitForSelector('html[data-fit="1"]', { timeout: 20000 })
await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true })
const pages = await page.evaluate(() => document.querySelectorAll('.page').length)
console.log('pdf ok, pages in html:', pages)
await browser.close()
