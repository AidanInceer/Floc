import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { globeTour, nextInHand, TOUR_REST_MS } from "./tour";

describe("nextInHand", () => {
  const hand = [4, 9, 2, 7, 0, 5];

  it("moves to the next tile in reading order", () => {
    expect(nextInHand(hand, 4)).toBe(9);
    expect(nextInHand(hand, 2)).toBe(7);
  });

  it("goes back to the first tile after the last", () => {
    expect(nextInHand(hand, 5)).toBe(4);
  });

  it("starts at the first tile when the current trip is not in the hand", () => {
    expect(nextInHand(hand, 11)).toBe(4);
  });
});

describe("globeTour", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves on once the globe has rested for the full time", () => {
    const go = vi.fn();
    const tour = globeTour(go);
    tour.rest(true);
    vi.advanceTimersByTime(TOUR_REST_MS - 1);
    expect(go).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it("does not move on when the globe stops resting", () => {
    const go = vi.fn();
    const tour = globeTour(go);
    tour.rest(true);
    vi.advanceTimersByTime(TOUR_REST_MS - 1);
    tour.rest(false);
    vi.advanceTimersByTime(TOUR_REST_MS);
    expect(go).not.toHaveBeenCalled();
  });

  it("keeps the rest running when told again that the globe is resting", () => {
    const go = vi.fn();
    const tour = globeTour(go);
    tour.rest(true);
    vi.advanceTimersByTime(TOUR_REST_MS - 1);
    tour.rest(true);
    vi.advanceTimersByTime(1);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it("waits while nobody can see the globe and takes a full rest when they can", () => {
    const go = vi.fn();
    const tour = globeTour(go);
    tour.rest(true);
    tour.seen(false);
    vi.advanceTimersByTime(TOUR_REST_MS * 2);
    expect(go).not.toHaveBeenCalled();
    tour.seen(true);
    vi.advanceTimersByTime(TOUR_REST_MS - 1);
    expect(go).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it("moves on again after the next rest, so the cycle never ends", () => {
    const go = vi.fn();
    const tour = globeTour(go);
    for (let lap = 1; lap <= 3; lap++) {
      tour.rest(true);
      vi.advanceTimersByTime(TOUR_REST_MS);
      expect(go).toHaveBeenCalledTimes(lap);
      tour.rest(false);
    }
  });

  it("waits until every hold is released", () => {
    const go = vi.fn();
    const tour = globeTour(go);
    tour.rest(true);
    tour.hold("pointer", true);
    tour.hold("focus", true);
    tour.hold("pointer", false);
    vi.advanceTimersByTime(TOUR_REST_MS * 2);
    expect(go).not.toHaveBeenCalled();
    tour.hold("focus", false);
    vi.advanceTimersByTime(TOUR_REST_MS);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it("says a move is the tour's until a person acts", () => {
    const tour = globeTour(vi.fn());
    expect(tour.touring()).toBe(false);
    tour.rest(true);
    vi.advanceTimersByTime(TOUR_REST_MS);
    expect(tour.touring()).toBe(true);
    tour.byPerson();
    expect(tour.touring()).toBe(false);
  });

  it("counts the move as the tour's while it starts", () => {
    let duringMove = false;
    const tour = globeTour(() => {
      duringMove = tour.touring();
    });
    tour.rest(true);
    vi.advanceTimersByTime(TOUR_REST_MS);
    expect(duringMove).toBe(true);
  });

  it("never moves on after it is stopped", () => {
    const go = vi.fn();
    const tour = globeTour(go);
    tour.rest(true);
    tour.stop();
    vi.advanceTimersByTime(TOUR_REST_MS * 2);
    expect(go).not.toHaveBeenCalled();
  });
});
