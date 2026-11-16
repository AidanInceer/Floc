import { ButtonLink, PageTitle } from "@/components/system/ui";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[42rem] px-4 pb-20 pt-16 text-center sm:px-6">
      <PageTitle>
        This page has no answer for you
      </PageTitle>
      <p className="mx-auto mt-4 max-w-[48ch] text-sm text-ink-soft">
        It either doesn&rsquo;t exist or isn&rsquo;t yours to see. If someone sent you a
        link, ask them to check it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink variant="primary" href="/trips">
          Your trips
        </ButtonLink>
        <ButtonLink variant="secondary" href="/explore">
          Explore
        </ButtonLink>
      </div>
    </div>
  );
}
