import { useStore } from "@nanostores/react";
import * as turf from "@turf/turf";
import React from "react";
import { toast } from "react-toastify";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar-l";
import {
    addQuestion,
    defaultCustomQuestions,
    hiderMode,
    isLoading,
    leafletMapContext,
} from "@/lib/context";
import {
    radiusCoordinate,
    tentacleCoordinates,
} from "@/maps/questionCoordinates";

export const AddQuestionDialog = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const $isLoading = useStore(isLoading);
    const [open, setOpen] = React.useState(false);

    const runAddRadius = () => {
        addQuestion({
            id: "radius",
            data: {
                lat: radiusCoordinate.lat,
                lng: radiusCoordinate.lng,
                radius: 500,
                unit: "meters",
                within: true,
            },
        });
        return true;
    };

    const runAddThermometer = () => {
        const map = leafletMapContext.get();
        if (!map) return false;
        const center = map.getCenter();
        const destination = turf.destination([center.lng, center.lat], 5, 90, {
            units: "miles",
        });

        addQuestion({
            id: "thermometer",
            data: {
                latA: center.lat,
                lngB: center.lng,
                latB: destination.geometry.coordinates[1],
                lngA: destination.geometry.coordinates[0],
            },
        });

        return true;
    };

    const runAddTentacles = () => {
        const seeker = hiderMode.get();

        const orderedTentacleCoordinates =
            seeker === false
                ? [...tentacleCoordinates]
                : [...tentacleCoordinates].sort((a, b) => {
                      const seekerPoint = turf.point([
                          seeker.longitude,
                          seeker.latitude,
                      ]);

                      const distanceA = turf.distance(
                          seekerPoint,
                          turf.point([a.lng, a.lat]),
                          { units: "kilometers" },
                      );
                      const distanceB = turf.distance(
                          seekerPoint,
                          turf.point([b.lng, b.lat]),
                          { units: "kilometers" },
                      );

                      return distanceA - distanceB;
                  });

        const centerPoint =
            seeker === false
                ? orderedTentacleCoordinates[0]
                : { lat: seeker.latitude, lng: seeker.longitude };

        const isWithinTwoKilometers = orderedTentacleCoordinates.every(
            (coordinate) => {
                const distance = turf.distance(
                    turf.point([centerPoint.lng, centerPoint.lat]),
                    turf.point([coordinate.lng, coordinate.lat]),
                    { units: "kilometers" },
                );

                return distance <= 2;
            },
        );

        if (!isWithinTwoKilometers) {
            toast.error(
                "Tentacle coordinates must all be within 2 km of the seeker (or the first tentacle coordinate if seeker is not set).",
            );
            return false;
        }

        const places = orderedTentacleCoordinates.map((coordinate, index) => ({
            type: "Feature" as const,
            geometry: {
                type: "Point" as const,
                coordinates: [coordinate.lng, coordinate.lat],
            },
            properties: {
                name: `Tentacle ${index + 1}`,
            },
        }));

        addQuestion({
            id: "tentacles",
            data: {
                lat: centerPoint.lat,
                lng: centerPoint.lng,
                radius: 2,
                unit: "kilometers",
                locationType: "custom",
                places,
            },
        });
        return true;
    };

    const runAddMatching = () => {
        const map = leafletMapContext.get();
        if (!map) return false;
        const center = map.getCenter();
        addQuestion({
            id: "matching",
            data: defaultCustomQuestions.get()
                ? { lat: center.lat, lng: center.lng, type: "custom-points" }
                : { lat: center.lat, lng: center.lng },
        });
        return true;
    };

    const runAddMeasuring = () => {
        const map = leafletMapContext.get();
        if (!map) return false;
        const center = map.getCenter();
        addQuestion({
            id: "measuring",
            data: defaultCustomQuestions.get()
                ? { lat: center.lat, lng: center.lng, type: "custom-measure" }
                : { lat: center.lat, lng: center.lng },
        });
        return true;
    };

    const runPasteQuestion = async () => {
        if (!navigator || !navigator.clipboard) {
            toast.error("Clipboard API not supported in your browser");
            return false;
        }

        try {
            await toast.promise(
                navigator.clipboard.readText().then((text) => {
                    const parsed = JSON.parse(text);
                    const question =
                        parsed &&
                        typeof parsed === "object" &&
                        !Array.isArray(parsed)
                            ? { ...parsed, key: Math.random() }
                            : parsed;

                    return addQuestion(question);
                }),
                {
                    pending: "Reading from clipboard",
                    success: "Question added from clipboard!",
                    error: "No valid question found in clipboard",
                },
                { autoClose: 1000 },
            );

            return true;
        } catch {
            return false;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogTitle>Add Question</DialogTitle>
                <DialogDescription>
                    Select which question type you would like to add.
                </DialogDescription>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <SidebarMenuButton
                        onClick={() => {
                            if (runAddRadius()) setOpen(false);
                        }}
                        disabled={$isLoading}
                    >
                        Add Radius
                    </SidebarMenuButton>
                    <SidebarMenuButton
                        onClick={() => {
                            if (runAddThermometer()) setOpen(false);
                        }}
                        disabled={$isLoading}
                    >
                        Add Thermometer
                    </SidebarMenuButton>
                    <SidebarMenuButton
                        onClick={() => {
                            if (runAddTentacles()) setOpen(false);
                        }}
                        disabled={$isLoading}
                    >
                        Add Tentacles
                    </SidebarMenuButton>
                    <SidebarMenuButton
                        onClick={() => {
                            if (runAddMatching()) setOpen(false);
                        }}
                        disabled={$isLoading}
                    >
                        Add Matching
                    </SidebarMenuButton>
                    <SidebarMenuButton
                        onClick={() => {
                            if (runAddMeasuring()) setOpen(false);
                        }}
                        disabled={$isLoading}
                    >
                        Add Measuring
                    </SidebarMenuButton>
                    <SidebarMenuButton
                        onClick={async () => {
                            const ok = await runPasteQuestion();
                            if (ok) setOpen(false);
                        }}
                        disabled={$isLoading}
                    >
                        Paste Question
                    </SidebarMenuButton>
                </div>
            </DialogContent>
        </Dialog>
    );
};
