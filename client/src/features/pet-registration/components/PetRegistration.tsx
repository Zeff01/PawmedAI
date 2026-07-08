import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Send, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

const petSchema = z.object({
    petName: z.string().min(1, 'Pet name is required'),

    petBirthdate: z.string().optional(),

    petAge: z.coerce
        .number({
            invalid_type_error: 'Pet age is required',
            required_error: 'Pet age is required',
        })
        .min(0, 'Age must be 0 or greater'),

    petGender: z.string().min(1, 'Please select a pet gender'),

    petWeight: z.preprocess(
        (value) => (value === '' ? undefined : value),
        z.coerce
            .number()
            .positive('Weight must be greater than 0')
            .optional()
    ),

    petBreed: z.string().min(1, 'Pet breed is required'),
})

type PetFormValues = z.infer<typeof petSchema>
type PetFormInput = z.input<typeof petSchema>
type PetFormOutput = z.output<typeof petSchema>

const initialForm: PetFormValues = {
    petName: '',
    petAge: 0,
    petWeight: undefined,
    petBirthdate: '',
    petGender: '',
    petBreed: '',
}

export function PetRegistration() {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const form = useForm<PetFormInput, PetFormValues, PetFormOutput>({
        resolver: zodResolver(petSchema),
        defaultValues: initialForm,
    })

    const resetForm = () => {
        form.reset(initialForm)
        setStatus('idle')
        setMessage('')
    }

    const handleSubmit = async (values: PetFormValues) => {
        setIsSubmitting(true)
        setStatus('idle')
        setMessage('')

        try {
            console.log("Pet Registered: ", values)
            setStatus('success')
            setMessage('Pet Registered Sucessfully')
            form.reset(initialForm)
        } catch (error) {
            setStatus('error')
            setMessage(error instanceof Error ? error.message : 'Pet Registered Failed.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen)
                if (!nextOpen) {
                    resetForm()
                }
            }}
        >
            <TooltipProvider>
                <Tooltip>
                    <div className="fixed bottom-5 right-5 z-40 sm:bottom-8 sm:right-8">
                        <DialogTrigger asChild>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    size="icon"
                                    className="size-12 rounded-full bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] hover:bg-blue-700 focus-visible:ring-blue-300"
                                    aria-label="Register a pet"
                                >
                                    <Plus className="size-4 stroke-[2.25]" aria-hidden="true" />
                                </Button>
                            </TooltipTrigger>
                        </DialogTrigger>
                    </div>
                    <TooltipContent side="top" align="center" className="px-3 py-2 text-sm">
                        Register a pet
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DialogContent className="rounded-xl border-blue-100 p-0 sm:max-w-md">
                <div className="relative overflow-hidden rounded-xl">
                    <div className="border-b border-slate-100 bg-blue-50 px-5 py-4">
                        <DialogHeader className="pr-10">
                            <DialogTitle>Pet Registration</DialogTitle>
                            <DialogDescription>
                                Please fill out the details about your pet.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label="Close"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </Button>
                        </DialogClose>
                    </div>

                    <Form {...form}>
                        <form
                            className="space-y-4 bg-white p-5"
                            onSubmit={form.handleSubmit(handleSubmit)}
                        >
                            <FormField
                                control={form.control}
                                name="petName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-800">Pet Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100"
                                                placeholder="e.g. Max"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="petBreed"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-800">Breed</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100"
                                                placeholder="e.g. Golden Retriever"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="petAge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-800">Age</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100"
                                                    placeholder="0"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="petWeight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-800">Weight (kg)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100"
                                                    placeholder="0"
                                                    {...field}
                                                    value={(field.value as number | undefined) ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="petGender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-800">Gender</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="petBirthdate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-800">Birthdate</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    className="h-11 rounded-lg bg-white focus-visible:border-blue-500 focus-visible:ring-blue-100"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {message && (
                                <p
                                    className={
                                        status === 'success'
                                            ? 'rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700'
                                            : 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'
                                    }
                                    role={status === 'error' ? 'alert' : 'status'}
                                >
                                    {message}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 w-full gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:ring-blue-200"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Send className="size-4" aria-hidden="true" />
                                )}
                                {isSubmitting ? 'Registering' : 'Register pet'}
                            </Button>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
