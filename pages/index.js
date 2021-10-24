import Head from "next/head";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Client } from "@notionhq/client";
import { MapPin, Truck } from "react-feather";

export default function Home(couriers) {
	const googlemap = useRef(null);
	const [hidden, setHidden] = useState(false);
	const [originAddress, setOriginAddress] = useState({});
	const [originId, setOriginId] = useState();
	const [destinationAddress, setDestinationAddress] = useState({});
	const [destinationId, setDestinationId] = useState();
	let map, originAutoComplete, destinationAutoComplete;
	const metroTerms = ["ncr", "metromanila", "kalakhangmaynila"];

	function initMap() {
		const loader = new Loader({
			apiKey: process.env.NEXT_PUBLIC_API_KEY,
			version: "weekly",
			libraries: ["places"],
		});

		loader.load().then(() => {
			map = new google.maps.Map(googlemap.current, {
				center: { lat: 14.557620058059333, lng: 121.02322325879963 },
				zoom: 15,
				disableDefaultUI: true,
			});
			initAutocomplete();
		});
	}

	function initAutocomplete() {
		const setting = {
			componentRestrictions: { country: ["ph"] },
			fields: ["address_components", "name", "geometry", "place_id"],
		};

		originAutoComplete = new google.maps.places.Autocomplete(
			document.querySelector("#origin"),
			setting
		);
		destinationAutoComplete = new google.maps.places.Autocomplete(
			document.querySelector("#destination"),
			setting
		);

		originAutoComplete.addListener("place_changed", fillInOriginAddress);
		destinationAutoComplete.addListener(
			"place_changed",
			fillInDestinationAddress
		);
		if (originId && destinationId) {
			calculateAndDisplayRoute();
		}
	}

	function calculateAndDisplayRoute() {
		const directionsRenderer = new google.maps.DirectionsRenderer();
		const directionsService = new google.maps.DirectionsService();
		directionsService
			.route({
				origin: {
					placeId: originId,
				},
				destination: {
					placeId: destinationId,
				},
				travelMode: google.maps.TravelMode.DRIVING,
			})
			.then((response) => {
				directionsRenderer.setDirections(response);
				directionsRenderer.setMap(map);
			})
			.catch((e) =>
				window.alert("Directions request failed due to " + response.status)
			);
	}

	function fillInOriginAddress() {
		const origPlace = originAutoComplete.getPlace();
		for (const component of origPlace.address_components) {
			const componentType = component.types[0];
			switch (componentType) {
				case "route": {
					document.querySelector(
						"#origin"
					).value = `${origPlace.name} ${component.long_name} `;
					break;
				}
				case "postal_code": {
					document.querySelector("#postcode").value = component.short_name;
					break;
				}
				case "locality": {
					document.querySelector("#locality").value = component.short_name;
					break;
				}
				case "administrative_area_level_1": {
					document.querySelector("#province").value = component.short_name;
					break;
				}
				case "country": {
					document.querySelector("#country").value = component.long_name;
					break;
				}
			}
		}
		setOriginId((prevOriginId) => (prevOriginId = origPlace.place_id));
	}

	function fillInDestinationAddress() {
		const destPlace = destinationAutoComplete.getPlace();

		for (const component of destPlace.address_components) {
			const componentType = component.types[0];
			switch (componentType) {
				case "route": {
					document.querySelector(
						"#destination"
					).value = `${destPlace.name} ${component.long_name} `;
					break;
				}
				case "postal_code": {
					document.querySelector("#postcode2").value = component.short_name;
					break;
				}
				case "locality": {
					document.querySelector("#locality2").value = component.short_name;
					break;
				}
				case "administrative_area_level_1": {
					document.querySelector("#province2").value = component.short_name;
					break;
				}
				case "country": {
					document.querySelector("#country2").value = component.long_name;
					break;
				}
			}
		}
		setDestinationId(
			(prevDestinationId) => (prevDestinationId = destPlace.place_id)
		);
	}
	function showCourierRates(event) {
		event.preventDefault();
		let input = event.target.elements;
		setOriginAddress({
			...originAddress,
			unit: input.unit.value,
			origin: input.origin.value,
			locality: input.locality.value,
			province: input.province.value,
			postcode: input.postcode.value,
			country: input.country.value,
		});
		setDestinationAddress({
			...destinationAddress,
			unit: input.unit2.value,
			destination: input.destination.value,
			locality: input.locality2.value,
			province: input.province2.value,
			postcode: input.postcode2.value,
			country: input.country2.value,
		});
		setHidden(hidden ? false : true);
	}

	useEffect(() => {
		initMap();
	});

	return (
		<div>
			<Head>
				<title>Shipping Calculator | Shipmates</title>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<div
				id='map'
				ref={googlemap}
				className='h-full w-full m-0 p-0 absolute'
			/>
			<main className='px-4'>
				<form id='address-form' onSubmit={showCourierRates} autoComplete='off'>
					<p className='font-semibold text-[#6432A5] pb-2'>
						<MapPin className='inline relative -top-1' size={17} /> Pick up
						Address
					</p>
					<p
						className={`${
							hidden
								? "block font-semibold text-sm pb-4 text-gray-700 px-4"
								: "hidden"
						}`}
					>
						{(originAddress.unit ? originAddress.unit + " " : "") +
							(originAddress.origin + ", ") +
							(originAddress.locality + ", ") +
							(originAddress.postcode + ", ") +
							(originAddress.province + ", " + originAddress.country)}
					</p>
					<div
						className={`${
							hidden ? "hidden" : "flex flex-wrap flex-col space-y-2 mb-4"
						}`}
					>
						<label>
							<span className='text-sm'>Address 1</span>
							<span className='block relative h-8 h-'>
								<input
									id='unit'
									name='unit'
									autoComplete='off'
									placeholder='Unit, Floor, Suite, etc.'
									className=''
								/>
							</span>
						</label>
						<label>
							<span className='text-sm'>Address 2</span>
							<span className='block relative h-8'>
								<input
									id='origin'
									name='origin'
									placeholder='Lot, Apartment, Building, etc.'
									autoComplete='off'
									className=''
								/>
							</span>
						</label>
						<div className='grid grid-cols-2 gap-6'>
							<label>
								<span className='text-sm'>City</span>
								<span className='block relative h-8'>
									<input
										className=''
										id='locality'
										autoComplete='off'
										name='locality'
										required
									/>
								</span>
							</label>
							<label>
								<span className='text-sm'>Province</span>
								<span className='block relative h-8'>
									<input
										className=''
										autoComplete='off'
										id='province'
										name='province'
										required
									/>
								</span>
							</label>
						</div>
						<div className='grid grid-cols-2 gap-6'>
							<label className='slim-field-right' htmlFor='postal_code'>
								<span className='text-sm'>Zip code</span>
								<span className='block relative h-8'>
									<input
										className='postcode '
										autoComplete='off'
										id='postcode'
										name='postcode'
										required
									/>
								</span>
							</label>
							<label>
								<span className='text-sm'>Country</span>
								<span className='block relative h-8'>
									<input
										className=''
										autoComplete='off'
										id='country'
										name='country'
										required
									/>
								</span>
							</label>
						</div>
					</div>
					<p className='font-semibold text-[#6432A5] pb-2'>
						<MapPin className='inline relative -top-1' size={17} /> {"  "}
						Delivery Address
					</p>
					<p
						className={`${
							hidden
								? "block font-semibold text-sm pb-4 text-gray-700 px-4"
								: "hidden"
						}`}
					>
						{(destinationAddress.unit ? destinationAddress.unit + " " : "") +
							(destinationAddress.destination + ", ") +
							(destinationAddress.locality + ", ") +
							(destinationAddress.postcode + ", ") +
							(destinationAddress.province + ", " + destinationAddress.country)}
					</p>
					<div
						className={`${
							hidden ? "hidden" : "flex flex-wrap flex-col space-y-2 mb-4"
						}`}
					>
						<label>
							<span className='text-sm'>Address 1</span>
							<span className='block relative h-8 h-'>
								<input
									id='unit2'
									name='unit2'
									autoComplete='off'
									placeholder='Unit, suite, or floor #'
									className=''
								/>
							</span>
						</label>
						<label>
							<span className='text-sm'>Address 2</span>
							<span className='block relative h-8'>
								<input
									placeholder='Lot, apartment, building'
									autoComplete='off'
									className=''
									id='destination'
									name='destination'
								/>
							</span>
						</label>
						<div className='grid grid-cols-2 gap-6'>
							<label>
								<span className='text-sm'>City</span>
								<span className='block relative h-8'>
									<input
										className=''
										autoComplete='off'
										id='locality2'
										name='locality2'
										required
									/>
								</span>
							</label>
							<label>
								<span className='text-sm'>Province</span>
								<span className='block relative h-8'>
									<input
										className=''
										autoComplete='off'
										id='province2'
										name='province2'
										required
									/>
								</span>
							</label>
						</div>

						<div className='grid grid-cols-2 gap-6'>
							<label className='slim-field-right' htmlFor='postal_code'>
								<span className='text-sm'>Zip code</span>
								<span className='block relative h-8'>
									<input
										className='postcode '
										autoComplete='off'
										id='postcode2'
										name='postcode2'
										required
									/>
								</span>
							</label>
							<label>
								<span className='text-sm'>Country</span>
								<span className='block relative h-8'>
									<input
										className=''
										autoComplete='off'
										id='country2'
										name='country2'
										required
									/>
								</span>
							</label>
						</div>
					</div>

					<div className={`${hidden ? "block" : "hidden"}`}>
						<p className='font-semibold text-[#6432A5] pb-2'>
							<Truck className='inline relative top-[-2px]' size={17} />
							{"  "}
							Available Couriers{" "}
						</p>
						<ul>
							{couriers.results.map((courier) => {
								let origProvince = String(originAddress.province)
									.replace(/ /g, "")
									.toLowerCase();
								let destProvince = String(destinationAddress.province)
									.replace(/ /g, "")
									.toLowerCase();
								{
								}
								if (
									courier.properties["Deliver Outside Metro Manila"].number !=
										null ||
									(metroTerms.indexOf(origProvince) > -1 &&
										metroTerms.indexOf(destProvince) > -1)
								) {
									return (
										<li
											key={courier.id}
											className='grid grid-cols-2 gap-6 border-[#6432A5]  text-[#6432A5] border-2 text-xs rounded-lg my-2 px-4 py-2 font-semibold shadow'
										>
											<div className='flex flex-wrap items-center'>
												<div className='w-9 h-9 rounded-lg overflow-hidden bg-white shadow'>
													<Image
														src={courier.properties.Logo.files[0].file.url}
														alt={courier.properties.Name.title[0].plain_text}
														width={200}
														height={200}
														laceholder='blur'
														blurDataURL='/img/placeholder.png'
													/>
												</div>
												<p className='mx-2'>
													{courier.properties.Name.title[0].plain_text}
												</p>
											</div>
											<p className='flex flex-wrap items-center justify-end text-right text-2xl'>
												₱
												{metroTerms.indexOf(origProvince) > -1 &&
												metroTerms.indexOf(destProvince) > -1
													? courier.properties["Deliver to Metro Manila"].number
													: courier.properties["Deliver Outside Metro Manila"]
															.number}
											</p>
										</li>
									);
								}
							})}
						</ul>
					</div>

					<button
						type='submit'
						className={`${
							hidden
								? "bg-none border-none text-[#6432A5]"
								: "border-[#6432A5] bg-[#6432A5] text-white text-xs"
						}`}
					>
						{hidden ? "Find Other Routes" : "Calculate Courier Rates"}
					</button>
				</form>
			</main>
		</div>
	);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
export async function getStaticProps() {
	const response = await notion.databases.query({
		database_id: process.env.NOTION_DATABASE_ID,
	});
	return {
		props: response,
		revalidate: 1,
	};
}
