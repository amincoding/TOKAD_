import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Fetch the word lists with better error handling
    try {
      // Fetch root words
      const rootWordsResponse = await fetch(new URL("/api/data/root-words", request.url))
      if (!rootWordsResponse.ok) {
        throw new Error(`Failed to fetch root words: ${rootWordsResponse.status}`)
      }
      const rootWordsText = await rootWordsResponse.text()

      // More robust parsing
      const rootWords = rootWordsText
        .split(/\n/)
        .map((line) => line.trim())
        .filter((word) => word.length > 0)

      // Fetch none words
      const noneWordsResponse = await fetch(new URL("/api/data/none-words", request.url))
      if (!noneWordsResponse.ok) {
        throw new Error(`Failed to fetch none words: ${noneWordsResponse.status}`)
      }
      const noneWordsText = await noneWordsResponse.text()

      // More robust parsing
      const noneWords = noneWordsText
        .split(/\n/)
        .map((line) => line.trim())
        .filter((word) => word.length > 0)

      // Split the text into words
      const words = text.split(/\s+/)

      // Process each word
      const segmentedWords = words.map((word) => {
        // If the word is in the none-words list, don't segment it
        if (noneWords.includes(word)) {
          return word
        }

        // If the word is in the root-words list, mark it as a root
        if (rootWords.includes(word)) {
          return `[${word}]`
        }

        // Try to find the longest matching root word
        let segmented = word
        let maxLength = 0
        let bestMatch = ""

        for (const rootWord of rootWords) {
          if (word.startsWith(rootWord) && rootWord.length > maxLength) {
            maxLength = rootWord.length
            bestMatch = rootWord
          }
        }

        // If we found a matching root word, segment the word
        if (bestMatch) {
          const suffix = word.substring(bestMatch.length)
          if (suffix) {
            segmented = `[${bestMatch}]+${suffix}`
          } else {
            segmented = `[${bestMatch}]`
          }
        }

        return segmented
      })

      const segmentedText = segmentedWords.join(" ")

      return NextResponse.json({ segmentedText })
    } catch (error) {
      console.error("Error processing word lists:", error)
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Error processing word lists",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

