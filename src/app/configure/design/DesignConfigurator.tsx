"use client"

import HandleComponent from "@/components/HandleComponent";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatPrice } from "@/lib/utils";
import NextImage from "next/image";
import { Rnd } from "react-rnd";
import { Radio, RadioGroup, Label as LabelHeadless, Description } from "@headlessui/react";
import { Fragment, useRef, useState } from "react";
import { COLORS, FINISHES, MATERIALS, MODELS } from "@/validators/option-validator";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { BASE_PRICE } from "@/config/products";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { saveConfig as _saveConfig, saveConfig, SaveConfigArgs } from "./actions";
import { useRouter } from "next/navigation";

interface DesignConfiguratorProps {
    configId: string
    imageUrl: string
    imageDimensions: {
        width: number
        height: number
    }
}

// this is possible only from the tanstack/react-query package
const DesignConfigurator = ({ configId, imageUrl, imageDimensions }: DesignConfiguratorProps) => {
    const { toast } = useToast();
    const router = useRouter();

    const { mutate: saveConfig } = useMutation({
        mutationKey: ["save-config"],
        mutationFn: async (args: SaveConfigArgs) => {
            await Promise.all([saveConfiguration(), _saveConfig(args)])
        },
        onError: () => {
            toast({
                title: "Something went wrong!",
                description: "There was an error on our end.  Please try again",
                variant: "destructive"
            })
        },
        onSuccess: () => {
            router.push(`/configure/preview?id=${configId}`);
        }
    });

    const [options, setOptions] = useState<{
        color: (typeof COLORS[number]),  // do this because COLORS are as const, so this makes it type safe
        model: (typeof MODELS.options)[number]
        material: (typeof MATERIALS.options)[number]
        finish: (typeof FINISHES.options)[number]
    }>({
        color: COLORS[0],
        model: MODELS.options[0],
        material: MATERIALS.options[0],
        finish: FINISHES.options[0]
    });

    const [renderedDimension, setRenderedDimension] = useState({
        width: imageDimensions.width / 4,
        height: imageDimensions.height / 4,
    });

    const [renderedPosition, setRenderedPosition] = useState({
        x: 150,
        y: 205
    });

    const phoneCaseRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { startUpload } = useUploadThing("imageUploader");

    async function saveConfiguration() {
        try {
            // ! means we are sure the element will exist
            // but if it does not, we will handle it in the catch block
            // This way we don't have to do this above this line of code if(!phoneCaseRef.current) return
            // Doing it in the manner of the above line, then the user would not get feedback on what went wrong
            // but by not doing it, typescript will complain, so we tell typescript that we know for sure this element will exist
            //   and if not, we will deal with it in the catch block to where we can let the user know something went wrong
            // left is how many pixels from the left most side of the entire page, to where the left of the phone starts.
            // similarly for top
            // renaming to caseLeft and caseTop because we will use left and top from the ref, so to avoid naming conflicts
            // caseLeft means phoneCaseLeft
            const { left: caseLeft, top: caseTop, width, height } = phoneCaseRef.current!.getBoundingClientRect();
            const { left: containerLeft, top: containerTop } = containerRef.current!.getBoundingClientRect();

            const leftOffset = caseLeft - containerLeft;
            const topOffset = caseTop - containerTop;

            // These actualX and actualyY coordinates are relative to the phone, so 0,0 is top left of the phone image
            const actualX = renderedPosition.x - leftOffset;
            const actualY = renderedPosition.y - topOffset;

            // create a canvas with exact dimensions of image over phone
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');  // context allows you to modify the canvas(draw an image on it)

            const userImage = new Image();
            userImage.crossOrigin ="anonymous";  // do this to avoid cors errors in next step
            userImage.src = imageUrl;

            await new Promise((resolve) => (userImage.onload = resolve));

            // the canvas and user image that is on phone, will have the same dimension
            // this will help us to export the image
            ctx?.drawImage(
                userImage,
                actualX,
                actualY,
                renderedDimension.width,
                renderedDimension.height,
            );

            // convert canvas to base64 format, as we cannot export a canvas directly as it is an html element
            const base64 = canvas.toDataURL();
            // base64 will be a long string with a comman in it to seperate data
            // we only want the part of the string after the comma as that part of the string represents our image
            const base64Data = base64.split(',')[1];

            // cannot save the image as a string, we need to convert it to an image eg. a blob
            const blob = base64ToBlob(base64Data, "image/png");

            // now we make the png image
            // The filename does not matter, because uploadthing will automatically create a file name for us
            const file = new File([blob], "filename.png", { type: "image/png"});

            // upload the file to uploadthing
            // configId is a property we passed into the component
            // We pass the config because if we don't, in our core.ts it will create a new config, 
            //  but it alreasdy exists, so we pass the id to that config so that it can be used
            // our core.ts handles updating the neon database to update the croppedImageUrl
            await startUpload([file], { configId });
        } catch (error) {
            toast({
                title: "Something went wrong!",
                description: "There was a problem saving your config. Please try again.",
                variant: "destructive"
            });
        }
    }

    function base64ToBlob(base64: string, mimeType: string) {
        //convert base64 to individual bytes
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for(let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        // we do this so we can convert this to a blob element
        // which means we can now make the mimetype for this array
        const byteArray = new Uint8Array(byteNumbers);

        return new Blob([byteArray], { type: mimeType });
    }

    // aspect ration of aspect-[896/1831] is the size of our phone image
    return (
        <div className='relative mt-20 grid grid-cols-1 lg:grid-cols-3 mb-20 pb-20'>
            <div ref={containerRef} className='relative h-[37.5rem] overflow-hidden col-span-2 w-full max-w-4xl flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'>
                <div className='relative w-60 bg-opacity-50 pointer-events-none aspect-[896/1831]'>
                    <AspectRatio
                        ref={phoneCaseRef}
                        ratio={896 / 1831}
                        className='pointer-events-none relative z-50 aspect-[896/1831] w-full'
                    >
                        <NextImage
                            fill
                            alt='phone image'
                            src='/phone-template.png'
                            className='pointer-events-none z-50 select-none'
                        />
                    </AspectRatio>

                    <div className='absolute z-40 inset-0 left-[3px] top-px right-[3px] bottom-px rounded-[32px] shadow-[0_0_0_99999px_rgba(229,231,235,0.6)]' />
                    <div
                        className={cn(
                            'absolute inset-0 left-[3px] top-px right-[3px] bottom-px rounded-[32px]',
                            `bg-${options.color.tw}`
                        )}
                    />
                </div>

                <Rnd 
                    default={{
                        x: 150,
                        y: 205,
                        height: imageDimensions.height / 4,
                        width: imageDimensions.width / 4,
                    }}
                    onResizeStop={(_, __, ref, ___, {x, y}) => {
                        setRenderedDimension({
                            height: parseInt(ref.style.height.slice(0, -2)),  // remove the px at the end of the height eg.. 50px(remove the last two characters which is px)
                            width: parseInt(ref.style.width.slice(0, -2)),
                        });

                        setRenderedPosition({
                            x: x,
                            y: y
                        });
                    }}
                    onDragStop={(_, data) => {
                        const {x, y} = data;
                        setRenderedPosition({
                            x: x,
                            y: y
                        })
                    }}
                    className="absolute z-20 border-[3px] border-primary"
                    lockAspectRatio
                    resizeHandleComponent={{
                        bottomRight: <HandleComponent />,
                        bottomLeft: <HandleComponent />,
                        topRight: <HandleComponent />,
                        topLeft: <HandleComponent />,
                    }}
                >
                    <div className="relative w-full h-full">
                        <NextImage src={imageUrl} fill alt="Your image" className="pointer-events-none" />
                    </div>
                </Rnd>
            </div>

            <div className="h-[37.5rem] w-full col-span-full lg:col-span-1 flex flex-col bg-white">
                <ScrollArea className="relative flex-1 overflow-auto">
                    <div aria-hidden="true" className="absolute z-10 inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white pointer-events-none" />
                
                    <div className="px-8 pb-12 pt-8">
                        <h2 className="tracking-tight font-bold text-3xl">Customize your case</h2>

                        <div className="w-full h-px bg-zinc-200 my-6" />

                        <div className="relative mt-4 h-full flex flex-col justify-between">
                            <div className="flex flex-col gap-6">
                                <RadioGroup 
                                    value={options.color}
                                    onChange={(val) => {
                                        setOptions((prev) => ({
                                            ...prev,
                                            color: val,
                                        }))
                                    }}    
                                >
                                    <Label>Color: {options.color.label}</Label>
                                    <div className="mt-3 flex items-center space-x-3">
                                        {COLORS.map((color) => (
                                            <Radio
                                                key={color.label} 
                                                value={color} 
                                                className={({checked}) => cn(
                                                    "relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 active:ring-0 focus:ring-0 active:outline-none focus:outline-none border-2 border-transparent",
                                                    {
                                                        [`border-${color.tw}`] : checked
                                                    }
                                                )}
                                            >
                                                <span className={cn(`bg-${color.tw}`, "h-8 w-8 rounded-full border border-black border-opacity-10")} />
                                            </Radio>
                                        ))}
                                    </div>
                                </RadioGroup>

                                <div className="relative flex flex-col gap-3 w-full">
                                    <Label>Model</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                                {options.model.label}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {MODELS.options.map((model) => (
                                                <DropdownMenuItem 
                                                    key={model.label} 
                                                    className={cn(
                                                        "flext text-sm gap-1 items-center p-1.5 cursor-default hover:bg-zinc-100",
                                                        {
                                                            "bg-zinc-100": model.label === options.model.label
                                                        }
                                                    )}
                                                    onClick={() => {
                                                        setOptions((prev) => ({...prev, model}))
                                                    }}
                                                >
                                                    <Check className={cn(
                                                        "mr-2 h-4 w-4",
                                                        model.label === options.model.label ? "opacity-100" : "opacity-0"
                                                    )} />
                                                    {model.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* MATERIALS AND FINISHES BOTH HAVE THE EXACT SAME STRUCTURE SO WE CAN MAP THEM LIKE THIS TOGETHER */}
                                {[MATERIALS, FINISHES].map(({name, options: selectableOptions}) => (
                                    <RadioGroup 
                                        key={name} 
                                        value={options[name]}
                                        onChange={(val) => {
                                            setOptions((prev) => ({
                                                ...prev,
                                                // We use [name] instead of name, because we are mapping over MATERIALS AND FINISH
                                                // so name could be name: material / finish
                                                // by using the square brackets we are specifically telling it to change the name and "not" finish
                                                // We are using name because the value of this Radio Group is set to name
                                                [name]: val
                                            }))
                                        }}    
                                    >
                                        <label>
                                            {/* Make sure first letter of name is in uppercase */}
                                            {name.slice(0,1).toUpperCase() + name.slice(1)}
                                        </label>

                                        <div className="mt-3 space-y-4">
                                            {selectableOptions.map((option) => (
                                                <Radio 
                                                    key={option.value} 
                                                    value={option} 
                                                    className={({checked}) => (
                                                        cn(
                                                            "relative block cursor-pointer rounded-lg bg-white px-6 py-4 shadow-sm border-2 border-zinc-200 focus:outline-none ring-0 focus:ring-0 outline-none sm:flex sm:justify-between",
                                                            {
                                                                "border-primary": checked
                                                            }
                                                        )
                                                    )}
                                                >
                                                    <span className="flex items-center">
                                                        <span className="flex flex-col text-sm">
                                                            <LabelHeadless 
                                                                as={Fragment}   >
                                                                <span className="font-medium text-gray-500">{option.label}</span>
                                                            </LabelHeadless>

                                                            {option.description ? (
                                                                <Description className="text-gray-500">
                                                                    <span className="block sm:inline">{option.description}</span>
                                                                </Description>
                                                            ) : null}
                                                        </span>
                                                    </span>

                                                    <Description className="mt-2 flex text-sm sm:ml-4 sm:mt-0 sm:flex-col sm:text-right">
                                                        <span className="font-medium text-gray-900">
                                                            {formatPrice(option.price / 100)}
                                                        </span>
                                                    </Description>
                                                </Radio>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="w-full px-8 h-16 bg-white">
                    <div className="h-px w-full bg-zinc-200" />
                    <div className="w-full h-full flex justify-end items-center">
                        <div className="w-full flex gap-6 items-center">
                            <p className="font-medium whitespace-nowrap">
                                {formatPrice((BASE_PRICE + options.finish.price + options.material.price) / 100)}
                            </p>
                            <Button 
                                onClick={() => saveConfig({
                                    configId,
                                    color: options.color.value,
                                    finish: options.finish.value,
                                    material: options.material.value,
                                    model: options.model.value,
                                  })} 
                                size="sm" 
                                className="w-full"
                            >
                                Continue 
                                <ArrowRight className="h-4 w-4 ml-1.5 inline" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DesignConfigurator;