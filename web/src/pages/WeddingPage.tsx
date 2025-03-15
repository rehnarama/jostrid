import { useImage } from "../hooks/useImages";

export const WeddingPage = () => {
  const { data: images } = useImage("jostrid23", { suspense: true });

  return (
    <>
      <div className="p-4 page">
        <h1>Bröllopsbilder</h1>
      </div>
      <div
        className="overflow-x-scroll whitespace-nowrap snap-x snap-mandatory align-middle group"
        tabIndex={0}
        onClick={(e) => {
          // Make sure clicked element is centered
          const target = e.target as HTMLElement;
          const onFullscreenSchange = () => {
            target.scrollIntoView({
              block: "center",
              inline: "center",
            });

            document.removeEventListener(
              "fullscreenchange",
              onFullscreenSchange,
            );
          };
          document.addEventListener("fullscreenchange", onFullscreenSchange);

          if (document.fullscreenElement === e.currentTarget) {
            document.exitFullscreen();
          } else {
            e.currentTarget.requestFullscreen();
          }
        }}
      >
        <div className="w-[calc(50vw-1.25rem)] flex-shrink-0 snap-start inline-block" />
        {images.map((image) => (
          <img
            src={image.url}
            key={image.id}
            loading="lazy"
            className="mx-3 inline-block max-h-[80dvh] group-fullscreen:max-h-[100dvh] max-w-[100vw] min-w-10 min-h-10 min-h snap-center object-contain translate-x-[-50%]"
          />
        ))}
        <div className="w-[calc(50vw-1.25rem)] flex-shrink-0 snap-end inline-block" />
      </div>
    </>
  );
};
