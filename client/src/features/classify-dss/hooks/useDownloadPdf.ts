import * as React from 'react'
import type { DiseaseClassificationResult } from '@/features/classify-dss/types'
import { isFurParentResult } from '@/features/classify-dss/types'
import { splitIntoItems, cleanText } from '@/features/classify-dss/utils/text'

export function useDownloadPdf(
  result: DiseaseClassificationResult,
  previewUrl: string | null,
) {
  return React.useCallback(async () => {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40
    const contentWidth = pageWidth - margin * 2

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image()
        img.src = src
        img.onload = () => resolve(img)
        img.onerror = () => resolve(img)
      })

    /* ── Header banner ── */
    pdf.setFillColor(24, 70, 200)
    pdf.rect(0, 0, pageWidth, 132, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)

    const logo = await loadImage('/icons/paw.png')
    if (logo.width && logo.height) {
      const logoSize = 28
      pdf.addImage(logo, 'PNG', margin, 32, logoSize, logoSize)
      pdf.text('Pawmed AI — Animal Disease Report', margin + 40, 52)
    } else {
      pdf.text('Pawmed AI — Animal Disease Report', margin, 52)
    }

    pdf.setFontSize(10)
    pdf.setTextColor(220, 235, 255)
    pdf.text('Veterinary diagnostics summary', margin, 74)

    if (!isFurParentResult(result)) {
      const confidence =
        typeof result.confidence === 'number'
          ? `${result.confidence}% confidence`
          : 'Confidence unavailable'
      pdf.setFontSize(10)
      pdf.setTextColor(255, 255, 255)
      pdf.text(
        confidence,
        pageWidth - margin - pdf.getTextWidth(confidence),
        74,
      )
    }

    /* ── Body ── */
    let cursorY = 150
    pdf.setTextColor(33, 37, 41)
    pdf.setFontSize(11)

    const addPage = () => {
      pdf.addPage()
      cursorY = margin
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.setTextColor(70, 80, 90)
    }

    const ensureSpace = (height: number) => {
      if (cursorY + height > pageHeight - margin) addPage()
    }

    if (previewUrl) {
      const img = await loadImage(previewUrl)
      if (img.width && img.height) {
        const imageHeight = Math.min(
          240,
          (img.height * contentWidth) / img.width,
        )
        ensureSpace(imageHeight + 24)
        const radius = 10
        pdf.saveGraphicsState()
        pdf.roundedRect(
          margin,
          cursorY,
          contentWidth,
          imageHeight,
          radius,
          radius,
          'F',
        )
        pdf.clip()
        pdf.addImage(img, 'PNG', margin, cursorY, contentWidth, imageHeight)
        pdf.restoreGraphicsState()
        cursorY += imageHeight + 24
      }
    }

    const addHeading = (text: string) => {
      ensureSpace(26)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(24, 70, 200)
      pdf.text(text, margin, cursorY)
      cursorY += 16
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.setTextColor(70, 80, 90)
    }

    const addParagraph = (text: string) => {
      const lines = pdf.splitTextToSize(text, contentWidth)
      ensureSpace(lines.length * 14 + 6)
      pdf.text(lines, margin, cursorY)
      cursorY += lines.length * 14 + 6
    }

    const addList = (items: string[]) => {
      items.forEach((item) => {
        const lines = pdf.splitTextToSize(item, contentWidth - 12)
        ensureSpace(lines.length * 14 + 6)
        pdf.text('•', margin, cursorY)
        pdf.text(lines, margin + 12, cursorY)
        cursorY += lines.length * 14
      })
      cursorY += 6
    }

    if (isFurParentResult(result)) {
      addHeading('What We Noticed')
      addParagraph(result.what_we_noticed)

      addHeading('What This Might Mean')
      addParagraph(result.what_this_might_mean)

      addHeading('Signs To Watch For')
      addList(result.signs_to_watch_for)

      addHeading('How Serious Does It Look')
      addParagraph(result.how_serious_does_it_look)

      addHeading('What You Can Do Right Now')
      addList(result.what_you_can_do_right_now)

      addHeading('See A Vet Because')
      addParagraph(result.see_a_vet_because)

      addHeading('Urgency')
      addParagraph(result.urgency)

      addHeading('Reassurance Note')
      addParagraph(result.reassurance_note)
    } else {
      addHeading('Condition')
      addParagraph(`${result.disease_name} — ${result.short_description}`)

      addHeading('Clinical Diagnosis')
      addParagraph(result.clinical_diagnosis)

      addHeading('Possible Causes')
      addList(result.possible_causes)

      addHeading('Symptoms')
      addList(result.symptoms)

      addHeading('Recommended Treatment')
      const treatmentItems = splitIntoItems(result.recommended_treatment)
      if (treatmentItems.length > 1) {
        addList(treatmentItems)
      } else {
        addParagraph(cleanText(result.recommended_treatment))
      }

      if (result.additional_notes) {
        addHeading('Additional Notes')
        addParagraph(result.additional_notes)
      }
    }

    const blobUrl = pdf.output('bloburl')
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
  }, [result, previewUrl])
}
