import { createFileRoute } from '@tanstack/react-router'

import { ClassifyDiseaseView } from '#/features/classify-dss/ClassifyDiseaseView'

export const Route = createFileRoute('/')({ component: ClassifyDiseasePage })

function ClassifyDiseasePage() {
  return (
    <div className="bg-[#ffffff]">
      <div className="bg-blue-600 px-5 py-3 md:px-30 text-white">
        <h1 className="text-xl font-bold">Classify Disease</h1>
        <p className="text-sm text-blue-200">
          Upload a clinical photo to generate a structured diagnostic brief.
        </p>
      </div>

      <div className="p-5 md:py-10 md:px-30 space-y-5">
        <ClassifyDiseaseView />
      </div>
    </div>
  )
}
