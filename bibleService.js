const fs = require('fs').promises
const path = require('path')

const readBible = async (fileName) => {
    const content = await fs.readFile(path.join(__dirname, 'data', fileName))
    return JSON.parse(content.toString())
}

let bibles = []

const findBooksInBible = (bible, keyWord) => {
    const pattern = new RegExp(
        Array.from(keyWord)
            .reduce((all, char) => `${all}${char}.{0,2}`, '^'), 
        'i')

    const startPattern = new RegExp(`^${keyWord}`, 'i')
    
    const matches = bible.books
        .filter(b => b.book.match(pattern))
        .map(b => {
            const {book,index} = b
            return { 
                translation: bible.translation,
                book, 
                index,
                score: b.book.match(startPattern) ? 1 : 0.5
             }
        })

    if (!matches) return null

    return matches.sort((a,b) => b.score - a.score)[0]

}

const findBooks = (keyWord) => {
    return bibles.map(b => findBooksInBible(b, keyWord))
        .filter(b => b !== undefined)
}

const parse = (partial) => {
    
    const pattern = /(\d?\s?[a-z]{2,20})\s+(\d{1,3}):(\d{1,3})-?(\d{1,3})?/i

    const parsed = partial.match(pattern)

    if (parsed) {
        const books = findBooks(parsed[1])
        return  books.map(b => {
            return {
                book: b.book,
                translation: b.translation,
                bookIndex: b.index,
                chapter: parseInt(parsed[2]),
                verseStart: parseInt(parsed[3]),
                verseEnd: parsed[4] ? parseInt(parsed[4]) : undefined
            }
        })
    }
    return []
}

const query = ({translation, bookIndex, chapter, verseStart, verseEnd}) => {
    const bible = bibles.filter(b => b.translation === translation)[0]
    const book = bible.books[bookIndex]
    const last = verseEnd || verseStart
    return book.verses.filter(v => v.chapter === chapter && v.verse >= verseStart && v.verse <= last)                
}

const init = async () => {
    bibles = await Promise.all(
        ['en-nkjv.json', 'nl-nbg.json', 'id-tb.json']
        .map(fn => readBible(fn))
    )
}

module.exports = async () => {
    await init()
    return { query, parse }
}
