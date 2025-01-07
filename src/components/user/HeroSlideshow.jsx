import React, { useState, useEffect, useRef, forwardRef } from "react";
import { AiOutlineDoubleLeft, AiOutlineDoubleRight } from "react-icons/ai";
import { Link } from "react-router-dom";
import { getLatestUploads } from "../../api/movie";
import { useNotification } from "../../hooks";

let count = 0;
let intervalId;

let newTime = 0;
let lastTime = 0;

export default function HeroSlidShow() {
  const [currentSlide, setCurrentSlide] = useState(null); // Initialize as null
  const [clonedSlide, setClonedSlide] = useState(null); // Initialize as null
  const [slides, setSlides] = useState([]);
  const [upNext, setUpNext] = useState([]);
  const [visible, setVisible] = useState(true);
  const slideRef = useRef();
  const clonedSlideRef = useRef();

  const { updateNotification } = useNotification();

  const fetchLatestUploads = async (signal) => {
    try {
      const { error, movies } = await getLatestUploads(signal);
      if (error) {
        updateNotification("error", error);
        return;
      }

      if (movies.length > 0) {
        setSlides([...movies]);
        setCurrentSlide(movies[0]); // Set the first slide as currentSlide
      } else {
        updateNotification("info", "No movies found.");
      }
    } catch (error) {
      updateNotification("error", "Failed to fetch movies.");
    }
  };

  const startSlideShow = () => {
    intervalId = setInterval(() => {
      newTime = Date.now();
      const delta = newTime - lastTime;
      if (delta < 4000) return clearInterval(intervalId);
      handleOnNextClick();
    }, 3500);
  };

  const pauseSlideShow = () => {
    clearInterval(intervalId);
  };

  const updateUpNext = (currentIndex) => {
    if (!slides.length) return;

    const upNextCount = currentIndex + 1;
    const end = upNextCount + 3;

    let newSlides = [...slides];
    newSlides = newSlides.slice(upNextCount, end);

    if (!newSlides.length) {
      newSlides = [...slides].slice(0, 3);
    }

    setUpNext([...newSlides]);
  };

  const handleOnNextClick = () => {
    if (!slides.length) return; // Guard clause

    lastTime = Date.now();
    pauseSlideShow();
    setClonedSlide(slides[count]);
    count = (count + 1) % slides.length;
    setCurrentSlide(slides[count]);

    clonedSlideRef.current.classList.add("slide-out-to-left");
    slideRef.current.classList.add("slide-in-from-right");
    updateUpNext(count);
  };

  const handleOnPrevClick = () => {
    if (!slides.length) return; // Guard clause

    pauseSlideShow();
    setClonedSlide(slides[count]);
    count = (count + slides.length - 1) % slides.length;

    setCurrentSlide(slides[count]);
    clonedSlideRef.current.classList.add("slide-out-to-right");
    slideRef.current.classList.add("slide-in-from-left");
    updateUpNext(count);
  };

  const handleAnimationEnd = () => {
    const classes = [
      "slide-out-to-left",
      "slide-in-from-right",
      "slide-out-to-right",
      "slide-in-from-left",
    ];
    slideRef.current.classList.remove(...classes);
    clonedSlideRef.current.classList.remove(...classes);
    setClonedSlide(null);
    startSlideShow();
  };

  const handleOnVisibilityChange = () => {
    const visibility = document.visibilityState;
    if (visibility === "hidden") setVisible(false);
    if (visibility === "visible") setVisible(true);
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchLatestUploads(ac.signal);
    document.addEventListener("visibilitychange", handleOnVisibilityChange);

    return () => {
      pauseSlideShow();
      document.removeEventListener(
        "visibilitychange",
        handleOnVisibilityChange
      );
      ac.abort();
    };
  }, []);

  useEffect(() => {
    if (slides.length && visible) {
      startSlideShow();
      updateUpNext(count);
    } else pauseSlideShow();
  }, [slides.length, visible]);

  // Conditional rendering if currentSlide is not ready
  if (!currentSlide || !slides.length) {
    return <div className="w-full flex justify-center items-center aspect-video bg-gray-200 dark:bg-gray-800">Loading...</div>;
  }

  return (
    <div className="w-full flex">
      {/* Slide show section */}
      <div className="md:w-4/5 w-full aspect-video relative overflow-hidden">
        {/* current slide */}
        <Slide
          ref={slideRef}
          title={currentSlide.title}
          src={currentSlide.poster}
          id={currentSlide.id}
        />

        {/* cloned slide */}
        {clonedSlide && (
          <Slide
            ref={clonedSlideRef}
            onAnimationEnd={handleAnimationEnd}
            className="absolute inset-0"
            src={clonedSlide.poster}
            title={clonedSlide.title}
            id={clonedSlide.id}
          />
        )}

        <SlideShowController
          onNextClick={handleOnNextClick}
          onPrevClick={handleOnPrevClick}
        />
      </div>

      {/* Up Next Section */}
      <div className="w-1/5 md:block hidden space-y-3 px-3">
        <h1 className="font-semibold text-2xl text-primary dark:text-white">
          Up Next
        </h1>
        {upNext.map(({ poster, id }) => {
          return (
            <img
              key={id}
              src={poster}
              alt=""
              className="aspect-video object-cover rounded"
            />
          );
        })}
      </div>
    </div>
  );
}

const SlideShowController = ({ onNextClick, onPrevClick }) => {
  const btnClass =
    "bg-primary rounded border-2 text-white text-xl p-2 outline-none";
  return (
    <div className="absolute top-1/2 -translate-y-1/2 w-full flex items-center justify-between px-2">
      <button onClick={onPrevClick} className={btnClass} type="button">
        <AiOutlineDoubleLeft />
      </button>
      <button onClick={onNextClick} className={btnClass} type="button">
        <AiOutlineDoubleRight />
      </button>
    </div>
  );
};

const Slide = forwardRef((props, ref) => {
  const { title, id, src, className = "", ...rest } = props;
  return (
    <Link
      to={"/movie/" + id}
      ref={ref}
      className={"w-full cursor-pointer block " + className}
      {...rest}
    >
      {src ? (
        <img className="aspect-video object-cover" src={src} alt="" />
      ) : null}
      {title ? (
        <div className="absolute inset-0 flex flex-col justify-end py-3 bg-gradient-to-t from-white via-transparent dark:from-primary dark:via-transparent">
          <h1 className="font-semibold text-4xl dark:text-highlight-dark text-highlight">
            {title}
          </h1>
        </div>
      ) : null}
    </Link>
  );
});