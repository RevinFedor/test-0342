import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/shared/ui/components/ui/button"
import parse from 'html-react-parser'

interface PagedTextProps {
  text?: string;
  wordsPerPage?: number;
}

export default function PagedText({ text = '', wordsPerPage = 300 }: PagedTextProps) {
  const [pages, setPages] = useState<string[][]>([])
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    if (!text) {
      setPages([])
      return
    }

    const splitHtmlIntoPages = (html: string, wordsPerPage: number) => {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html

      const words = tempDiv.innerText.split(/\s+/)
      const pagesArray: string[][] = []
      let currentPageWords: string[] = []
      let currentColumn: string[] = []

      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const nodeWords = node.textContent?.split(/\s+/) || []
          for (const word of nodeWords) {
            if (currentColumn.length < wordsPerPage) {
              currentColumn.push(word)
            } else {
              if (currentPageWords.length === 0) {
                currentPageWords.push(currentColumn.join(' '))
                currentColumn = [word]
              } else {
                currentPageWords.push(currentColumn.join(' '))
                pagesArray.push(currentPageWords)
                currentPageWords = []
                currentColumn = [word]
              }
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          const tag = element.tagName.toLowerCase()
          const attributes = Array.from(element.attributes)
            .map(attr => `${attr.name}="${attr.value}"`)
            .join(' ')

          currentColumn.push(`<${tag}${attributes ? ' ' + attributes : ''}>`)
          for (const childNode of Array.from(node.childNodes)) {
            processNode(childNode)
          }
          currentColumn.push(`</${tag}>`)
        }
      }

      processNode(tempDiv)

      if (currentColumn.length > 0) {
        currentPageWords.push(currentColumn.join(' '))
      }
      if (currentPageWords.length > 0) {
        pagesArray.push(currentPageWords)
      }

      return pagesArray
    }

    const pagesArray = splitHtmlIntoPages(text, wordsPerPage)
    setPages(pagesArray)
    setCurrentPage(0)
  }, [text, wordsPerPage])

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1))
  }

  if (pages.length === 0) {
    return <div className="text-center p-4">Нет текста для отображения.</div>
  }

  return (
    <div className="mx-auto p-4">
      <div className="grid grid-cols-2 gap-4 mb-4 text-[17px]">
        <div className="border p-4 rounded">
          {parse(pages[currentPage][0] || '')}
        </div>
        <div className="border p-4 rounded">
          {parse(pages[currentPage][1] || '')}
        </div>
      </div>


      <div className="flex justify-between items-center">
        <Button
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Предыдущая
        </Button>
        <span>Страница {currentPage + 1} из {pages.length}</span>
        <Button
          onClick={goToNextPage}
          disabled={currentPage === pages.length - 1}
          variant="outline"
        >
          Следующая <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}