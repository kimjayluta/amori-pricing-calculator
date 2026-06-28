import { getLibraryMaterials } from '@/actions/material-library'
import { MaterialLibraryClient } from '@/components/library/material-library-client'

export default async function MaterialLibraryPage() {
  const result = await getLibraryMaterials()
  const materials = result.success ? result.data : []

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Material Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Saved materials for quick reuse in the pricing calculator. Editing prices here does not affect existing pricing versions.
        </p>
      </div>

      <MaterialLibraryClient initialMaterials={materials} />
    </div>
  )
}
