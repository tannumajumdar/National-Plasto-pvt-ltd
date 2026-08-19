"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Info, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ICON_NAMES } from "@/components/ui/dynamic-icon";
import {
  saveAbout,
  saveContact,
  saveHero,
  saveJourney,
  saveStats,
  saveWhyChooseUs,
} from "@/lib/actions/content";
import type {
  AboutContent,
  ContactContent,
  HeroContent,
  JourneyContent,
  StatDTO,
  WhyChooseUsContent,
} from "@/types";

export function ContentEditor({
  hero,
  about,
  why,
  contact,
  journey,
  stats,
}: {
  hero: HeroContent;
  about: AboutContent;
  why: WhyChooseUsContent;
  contact: ContactContent;
  journey: JourneyContent;
  stats: StatDTO[];
}) {
  return (
    <Tabs defaultValue="hero">
      <TabsList className="flex w-full max-w-full flex-wrap justify-start">
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="stats">Statistics</TabsTrigger>
        <TabsTrigger value="why">Why Choose Us</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="journey">Journey</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
      </TabsList>

      <TabsContent value="hero"><HeroForm initial={hero} /></TabsContent>
      <TabsContent value="stats"><StatsForm initial={stats} /></TabsContent>
      <TabsContent value="why"><WhyForm initial={why} /></TabsContent>
      <TabsContent value="about"><AboutForm initial={about} /></TabsContent>
      <TabsContent value="journey"><JourneyForm initial={journey} /></TabsContent>
      <TabsContent value="contact"><ContactForm initial={contact} /></TabsContent>
    </Tabs>
  );
}

/* ------------------------------------------------------------------ */

function useContentForm<T extends Record<string, any>>(
  defaults: T,
  action: (values: any) => Promise<{ ok: boolean; message?: string; fields?: Record<string, string> }>,
  transform?: (values: T) => any,
) {
  const router = useRouter();
  const form = useForm<T>({ defaultValues: defaults as any });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await action(transform ? transform(values as T) : values);
    if (!result.ok) {
      if (result.fields) {
        for (const [field, message] of Object.entries(result.fields)) {
          form.setError(field as any, { message });
        }
      }
      toast.error(result.message ?? "Could not save.");
      return;
    }
    toast.success(result.message ?? "Saved");
    router.refresh();
  });

  return { ...form, onSubmit };
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function SaveBar({ loading }: { loading: boolean }) {
  return (
    <div className="flex justify-end">
      <Button type="submit" variant="accent" loading={loading}>
        {!loading && <Save />}
        Save changes
      </Button>
    </div>
  );
}

/* ---------------- Hero ---------------- */

function HeroForm({ initial }: { initial: HeroContent }) {
  const { register, onSubmit, formState } = useContentForm(
    {
      eyebrow: initial.eyebrow,
      headline: initial.headline,
      subheadline: initial.subheadline,
      primaryCtaLabel: initial.primaryCta.label,
      primaryCtaHref: initial.primaryCta.href,
      secondaryCtaLabel: initial.secondaryCta.label,
      secondaryCtaHref: initial.secondaryCta.href,
      image: initial.image ?? "",
    },
    saveHero,
  );
  const errors = formState.errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Homepage hero</CardTitle>
          <CardDescription>The first thing visitors see.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Eyebrow" htmlFor="eyebrow" error={errors.eyebrow?.message}>
            <Input id="eyebrow" {...register("eyebrow")} />
          </Field>

          <Field
            label="Headline"
            htmlFor="headline"
            error={errors.headline?.message}
            hint="The final two words are highlighted in the brand gradient."
          >
            <Textarea id="headline" rows={2} {...register("headline")} />
          </Field>

          <Field label="Subheadline" htmlFor="subheadline" error={errors.subheadline?.message}>
            <Textarea id="subheadline" rows={2} {...register("subheadline")} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Primary button label" htmlFor="p-label" error={errors.primaryCtaLabel?.message}>
              <Input id="p-label" {...register("primaryCtaLabel")} />
            </Field>
            <Field label="Primary button link" htmlFor="p-href" error={errors.primaryCtaHref?.message}>
              <Input id="p-href" {...register("primaryCtaHref")} />
            </Field>
            <Field label="Secondary button label" htmlFor="s-label" error={errors.secondaryCtaLabel?.message}>
              <Input id="s-label" {...register("secondaryCtaLabel")} />
            </Field>
            <Field label="Secondary button link" htmlFor="s-href" error={errors.secondaryCtaHref?.message}>
              <Input id="s-href" {...register("secondaryCtaHref")} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <SaveBar loading={formState.isSubmitting} />
    </form>
  );
}

/* ---------------- Stats ---------------- */

function StatsForm({ initial }: { initial: StatDTO[] }) {
  const { register, control, onSubmit, formState } = useContentForm(
    { stats: initial.map((s) => ({ ...s, suffix: s.suffix ?? "" })) },
    saveStats,
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Animated statistics</CardTitle>
          <CardDescription>
            Shown as counters on the homepage and About page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="flex gap-2.5 rounded-xl border border-border bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
            <Info className="size-4 shrink-0 text-accent" />
            <span>
              <span className="font-semibold text-foreground">Products</span> and{" "}
              <span className="font-semibold text-foreground">Collections</span> are counted
              live from your catalogue, so their values cannot be edited. The remaining
              figures were never supplied by the source material — enter a real number to
              publish one; leaving it blank keeps it hidden rather than showing an invented
              figure.
            </span>
          </p>

          <div className="space-y-4">
            {initial.map((stat, i) => {
              const isComputed = Boolean(stat.computed);
              return (
                <div
                  key={stat.id}
                  className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-[1fr_7rem_5rem_auto] sm:items-end"
                >
                  <input type="hidden" {...register(`stats.${i}.id` as const)} />

                  <div className="space-y-2">
                    <Label htmlFor={`stat-label-${i}`}>Label</Label>
                    <Input id={`stat-label-${i}`} {...register(`stats.${i}.label` as const)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`stat-value-${i}`}>Value</Label>
                    <Input
                      id={`stat-value-${i}`}
                      placeholder={isComputed ? "Auto" : "e.g. 25"}
                      disabled={isComputed}
                      {...register(`stats.${i}.value` as const)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`stat-suffix-${i}`}>Suffix</Label>
                    <Input
                      id={`stat-suffix-${i}`}
                      placeholder="+"
                      disabled={isComputed}
                      {...register(`stats.${i}.suffix` as const)}
                    />
                  </div>

                  <Controller
                    control={control}
                    name={`stats.${i}.isPublished` as const}
                    render={({ field }) => (
                      <div className="flex items-center gap-2 pb-2.5">
                        <Switch
                          id={`stat-pub-${i}`}
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor={`stat-pub-${i}`} className="cursor-pointer text-xs">
                          Show
                        </Label>
                      </div>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <SaveBar loading={formState.isSubmitting} />
    </form>
  );
}

/* ---------------- Why Choose Us ---------------- */

function WhyForm({ initial }: { initial: WhyChooseUsContent }) {
  const { register, control, onSubmit, formState } = useContentForm(initial, saveWhyChooseUs);
  const items = useFieldArray({ control, name: "items" as never });
  const errors = formState.errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why Choose Us</CardTitle>
          <CardDescription>The commitments section on the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Heading" htmlFor="why-heading" error={errors.heading?.message}>
            <Input id="why-heading" {...register("heading")} />
          </Field>
          <Field label="Subheading" htmlFor="why-sub" error={errors.subheading?.message}>
            <Textarea id="why-sub" rows={2} {...register("subheading")} />
          </Field>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Cards</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => items.append({ icon: "Sparkles", title: "", body: "" } as never)}
              >
                <Plus />Add card
              </Button>
            </div>

            {items.fields.map((field, i) => (
              <div key={field.id} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-[10rem_1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor={`why-icon-${i}`}>Icon</Label>
                  <Controller
                    control={control}
                    name={`items.${i}.icon` as never}
                    render={({ field: f }) => (
                      <Select value={String(f.value)} onValueChange={f.onChange}>
                        <SelectTrigger id={`why-icon-${i}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ICON_NAMES.map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <Input placeholder="Title" {...register(`items.${i}.title` as never)} />
                  <Textarea rows={2} placeholder="Description" {...register(`items.${i}.body` as never)} />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-start"
                  onClick={() => items.remove(i)}
                  aria-label="Remove card"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <SaveBar loading={formState.isSubmitting} />
    </form>
  );
}

/* ---------------- About ---------------- */

function AboutForm({ initial }: { initial: AboutContent }) {
  const { register, onSubmit, formState } = useContentForm(
    { ...initial, image: initial.image ?? "" },
    saveAbout,
  );
  const errors = formState.errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About the company</CardTitle>
          <CardDescription>Used on the homepage teaser and the About page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Heading" htmlFor="a-heading" error={errors.heading?.message}>
            <Input id="a-heading" {...register("heading")} />
          </Field>
          <Field label="Introduction" htmlFor="a-intro" error={errors.intro?.message}>
            <Textarea id="a-intro" rows={5} {...register("intro")} />
          </Field>
          <Field label="Vision" htmlFor="a-vision" error={errors.vision?.message}>
            <Textarea id="a-vision" rows={3} {...register("vision")} />
          </Field>
          <Field label="Mission" htmlFor="a-mission" error={errors.mission?.message}>
            <Textarea id="a-mission" rows={3} {...register("mission")} />
          </Field>
          <Field label="Quality statement" htmlFor="a-quality" error={errors.quality?.message}>
            <Textarea id="a-quality" rows={3} {...register("quality")} />
          </Field>
        </CardContent>
      </Card>
      <SaveBar loading={formState.isSubmitting} />
    </form>
  );
}

/* ---------------- Journey ---------------- */

function JourneyForm({ initial }: { initial: JourneyContent }) {
  const { register, control, onSubmit, formState } = useContentForm(initial, saveJourney);
  const milestones = useFieldArray({ control, name: "milestones" as never });
  const errors = formState.errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company journey</CardTitle>
          <CardDescription>
            The timeline on the About page. Years start blank — add real dates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Heading" htmlFor="j-heading" error={errors.heading?.message}>
            <Input id="j-heading" {...register("heading")} />
          </Field>
          <Field label="Subheading" htmlFor="j-sub" error={errors.subheading?.message}>
            <Input id="j-sub" {...register("subheading")} />
          </Field>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Milestones</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => milestones.append({ year: "", title: "", body: "" } as never)}
              >
                <Plus />Add milestone
              </Button>
            </div>

            {milestones.fields.map((field, i) => (
              <div key={field.id} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-[7rem_1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor={`j-year-${i}`}>Year</Label>
                  <Input id={`j-year-${i}`} placeholder="2010" {...register(`milestones.${i}.year` as never)} />
                </div>
                <div className="space-y-3">
                  <Input placeholder="Milestone title" {...register(`milestones.${i}.title` as never)} />
                  <Textarea rows={2} placeholder="What happened" {...register(`milestones.${i}.body` as never)} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-start"
                  onClick={() => milestones.remove(i)}
                  aria-label="Remove milestone"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <SaveBar loading={formState.isSubmitting} />
    </form>
  );
}

/* ---------------- Contact ---------------- */

function ContactForm({ initial }: { initial: ContactContent }) {
  const { register, onSubmit, formState } = useContentForm(
    {
      addressLine1: initial.addressLine1,
      addressLine2: initial.addressLine2,
      pincode: initial.pincode,
      phonePrimary: initial.phonePrimary,
      phoneSecondary: initial.phoneSecondary,
      emailGeneral: initial.emailGeneral,
      emailSales: initial.emailSales,
      hoursWeekday: initial.hoursWeekday,
      hoursWeekend: initial.hoursWeekend,
      mapEmbedUrl: initial.mapEmbedUrl,
      mapLabel: initial.mapLabel,
    },
    saveContact,
  );
  const errors = formState.errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
          <CardDescription>
            Shown in the footer and on the Contact page. These start as placeholders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address line 1" htmlFor="c1" error={errors.addressLine1?.message}>
              <Input id="c1" {...register("addressLine1")} />
            </Field>
            <Field label="Address line 2" htmlFor="c2" error={errors.addressLine2?.message}>
              <Input id="c2" {...register("addressLine2")} />
            </Field>
            <Field label="Pincode" htmlFor="c3" error={errors.pincode?.message}>
              <Input id="c3" {...register("pincode")} />
            </Field>
            <Field label="Primary phone" htmlFor="c4" error={errors.phonePrimary?.message}>
              <Input id="c4" {...register("phonePrimary")} />
            </Field>
            <Field label="Secondary phone" htmlFor="c5" error={errors.phoneSecondary?.message}>
              <Input id="c5" {...register("phoneSecondary")} />
            </Field>
            <Field label="General email" htmlFor="c6" error={errors.emailGeneral?.message}>
              <Input id="c6" type="email" {...register("emailGeneral")} />
            </Field>
            <Field label="Sales email" htmlFor="c7" error={errors.emailSales?.message}>
              <Input id="c7" type="email" {...register("emailSales")} />
            </Field>
            <Field label="Weekday hours" htmlFor="c8" error={errors.hoursWeekday?.message}>
              <Input id="c8" {...register("hoursWeekday")} />
            </Field>
            <Field label="Weekend hours" htmlFor="c9" error={errors.hoursWeekend?.message}>
              <Input id="c9" {...register("hoursWeekend")} />
            </Field>
            <Field label="Map label" htmlFor="c10" error={errors.mapLabel?.message}>
              <Input id="c10" {...register("mapLabel")} />
            </Field>
          </div>

          <Field
            label="Google Maps embed URL"
            htmlFor="c11"
            error={errors.mapEmbedUrl?.message}
            hint="In Google Maps: Share → Embed a map → copy the src URL from the iframe."
          >
            <Textarea id="c11" rows={3} {...register("mapEmbedUrl")} />
          </Field>
        </CardContent>
      </Card>
      <SaveBar loading={formState.isSubmitting} />
    </form>
  );
}
