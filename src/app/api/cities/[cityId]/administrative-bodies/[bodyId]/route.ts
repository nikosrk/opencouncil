import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { editAdministrativeBody, deleteAdministrativeBody } from '@/lib/db/administrativeBodies';
import { z } from 'zod';
import { withUserAuthorizedToEdit } from '@/lib/auth';

const bodySchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    name_en: z.string().min(2, {
        message: "Name (English) must be at least 2 characters.",
    }),
    type: z.enum(['council', 'committee', 'community'])
});

export async function PUT(
    request: NextRequest,
    { params }: { params: { cityId: string, bodyId: string } }
) {
    try {
        await withUserAuthorizedToEdit({ cityId: params.cityId });
        const body = await request.json();
        const { name, name_en, type } = bodySchema.parse(body);

        const updatedBody = await editAdministrativeBody(params.bodyId, {
            name,
            name_en,
            type,
        });

        revalidateTag(`city:${params.cityId}:administrativeBodies`);
        revalidatePath(`/${params.cityId}/people`);

        return NextResponse.json(updatedBody);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Failed to update administrative body:', error);
        return NextResponse.json(
            { error: 'Failed to update administrative body' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { cityId: string, bodyId: string } }
) {
    try {
        await withUserAuthorizedToEdit({ cityId: params.cityId });
        await deleteAdministrativeBody(params.bodyId);
        revalidateTag(`city:${params.cityId}:administrativeBodies`);
        revalidatePath(`/${params.cityId}/people`);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Failed to delete administrative body:', error);
        return NextResponse.json(
            { error: 'Failed to delete administrative body' },
            { status: 500 }
        );
    }
} 