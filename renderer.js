const fs = require('fs')
const {
    VK,
    PhotoAttachment
} = require('vk-io');
const config = require('C:/marketBot/config.json');
const tunnel = require('tunnel');
const cfg = excelToJson({
    sourceFile: './test.xlsx'
});

const vk = new VK({
    token: config.vk_token,


    timeout: 60000 * 2,

    uploadTimeout: 60000 * 2,

});
let anus = []

const resolvePhotos = async (sources) => {

    const photos = await Promise.all(

        sources.map(async (source) => {
            const resource = await vk.snippets.resolveResource(source);

            if (resource.type !== 'photo') {
                throw new Error(`"${source}" is not a photo`);
            }

            return `${resource.owner}_${resource.id}`;
        })
    );

    const response = await vk.api.photos.getById({
        photos
    })

    console.log(response)
    return response.map((payload) => (
        new PhotoAttachment(payload, vk)
    ));
};

const uploadMainMarketPhoto = async (source) => {

    const [photo] = await resolvePhotos([source]);


    return vk.upload.marketPhoto({
        group_id: config.group_id,
        source: photo.largePhoto,
        main_photo: 1
    })
};

const uploadExtraMarketPhotos = async (sources) => {
    const photos = await resolvePhotos(sources);

    return Promise.all(
        photos.map((photo) => (
            vk.upload.marketPhoto({
                group_id: config.group_id,
                source: photo.largePhoto,
                main_photo: 0
            }).catch(console.log)
        ))
    );
};


async function getallphotoids(sources) {

    let ids = await uploadExtraMarketPhotos(sources)
    let idsarr = []
    ids.forEach(function(entry) {

        idsarr.push(entry.id);

    });
    return idsarr;
}
let gpk = 0

async function main() {
    let array;


    if (document.getElementById('2').value == 1) {
        array = cfg.Sheet1

    } else {
        array = cfg.Sheet2
    }

    if (gpk == 0) {
        array.shift()
        gpk = 1
    }

    let arrlengh = array.length
   


    for (let i = 0; i < arrlengh; i++) {

        let posted = i + 1

        document.getElementById('head').innerHTML = `<h2>Market bot<small>добавлено товаров ${posted}/${arrlengh}</small></h2>`


        let main_photo = array[i].D

        let dop_photo = array[i].E.split(' ')

        let mid = await uploadMainMarketPhoto(main_photo)

        let dids = await getallphotoids(dop_photo)

        await vk.api.market.add({
            owner_id: '-' + parseInt(config.group_id),
            name: array[i].A,
            description: array[i].C,
            category_id: 1,
            price: array[i].F,
            main_photo_id: mid.id,
            photo_ids: dids
        });
    }

}


document.getElementById('mainfunc').addEventListener('click', main);